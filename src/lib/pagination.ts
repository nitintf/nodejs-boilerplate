import Sequelize from 'sequelize';
import R from 'ramda';
import { base64Encode, base64Decode } from 'app/lib/utils';
import { Promise } from 'bluebird';
import format from 'pg-format';

const { and, in: $in } = Sequelize.Op;

const MIN_LIMIT = 1;
export const DEFAULT_MAX_PAGE_SIZE = 100;

interface OrderProcessors {
  [key: string]: (col: Sequelize.col) => Sequelize.fn;
}

export type PaginationBind = Record<string, string>;

export interface PaginationIncludeOptions {
  model: any;
  as: string;
  required?: boolean;
  where?: any;
  attributes?: string[];
  on?: Record<string, Sequelize.where>;
  include?: PaginationIncludeOptions[];
}

interface PaginationParams<_Model, ModelAttributes> {
  where?: any;
  bind?: PaginationBind;
  include?: PaginationIncludeOptions[];
  limit?: number;
  createdAtColumn?: string;
  idColumn?: string;
  order?: Array<keyof ModelAttributes>;
  orderProcessors?: OrderProcessors;
  beforeCursor?: string;
  afterCursor?: string;
  descending?: boolean;
  includeTotalCount?: boolean;
  constrainLimit?: boolean;
  defaultLimit?: number;
  maxLimit?: number;
  attributes?: any;
  group?: any;
  logging?: any;
  sortBy?: string;
  queryIncludesAssociationAttribute?: boolean;
  paranoid?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  before?: string;
  after?: string;
  moreBefore: boolean;
  moreAfter: boolean;
  totalCount?: number;
}

export const setLimit = (defaultLimit: number, maxLimit: number, limit = defaultLimit) => {
  limit = R.min(R.max(limit, MIN_LIMIT), maxLimit);

  return limit;
};

export const createSearch = (modelName: string, column = 'tsv', searchField = 'search') =>
  Sequelize.literal(
    format(
      `"%s"."%s" @@ to_tsquery('pg_catalog.simple', NULLIF(plainto_tsquery('pg_catalog.simple', $%s)::text, '') || ':*')`,
      modelName,
      column,
      searchField,
    ),
  );

function createCursor<T>(row: Sequelize.Instance<T>, order: Array<keyof T>) {
  if (!row) {
    return;
  }

  return base64Encode(
    JSON.stringify(
      order.map((column) => {
        return row.get(column);
      }),
    ),
  );
}

function getOrderDirection(after: boolean, descending: boolean) {
  if (after) {
    if (descending) {
      return 'DESC';
    }

    return 'ASC';
  }

  if (descending) {
    return 'ASC';
  }

  return 'DESC';
}

function getOperator(after: boolean, descending: boolean) {
  if (after) {
    if (descending) {
      return '<';
    }

    return '>';
  }

  if (descending) {
    return '>';
  }

  return '<';
}

function createOrderColumn<I, A>(
  model: Sequelize.Model<I, A>,
  orderProcessors: OrderProcessors,
  modelName: string,
  column: keyof A,
) {
  // @ts-ignore - raw attributes isn't on @types/sequelize for Sequelize.Model
  const columnDef = model.rawAttributes[column];
  const fieldName = columnDef.field || columnDef.fieldName;
  const col = Sequelize.col(`${modelName}.${fieldName}`);
  const orderProcessor = orderProcessors[column as string];

  if (!orderProcessor) {
    return col;
  }

  return orderProcessor(col);
}

export const dateProcessor = (col: Sequelize.col) =>
  Sequelize.fn('date_trunc', 'milliseconds', Sequelize.fn('timezone', 'UTC', col));

/**
 * Find all records with the given query using cursor based pagination (also called keyset pagination).
 * The performance of this pagination technique is dependent on the indexes created on the underlying table.
 * Specifically, a compound index should exist on the columns included in the order param. For example, if
 * passing [created_at, id] as the order param, an index should exist on (created_at, id). If ordering by
 * [name, created_at], an index should exist on (name, created_at).
 *
 * @param {Sequelize.Model} model
 * @param {Object} [params] Params to pass to the query. All other options for findAll except replacements are supported.
 * @param {Array<string>} [params.order] Array of columns to order by. Limitations:
 *  - Columns must exist on the main model. You cannot order on columns of included models.
 *  - The names of columns in the order by are added as bind parameters. Make sure not to add conflicting parameters.
 *  - Columns are all ordered the same direction. You can't order one column ASC and another DESC.
 *  - Only columns with basic data types are guaranteed to work. For example, JSON and array columns should not be included.
 * @param {Object} [params.orderProcessors] Map of order key to function. Function is applied to the order column before including in the query.
 * @param {Object} [params.bind] Works like bind in findAll except only an object is accepted.
 * @param {string} [params.beforeCursor] Cursor to pass if requesting the previous page of records.
 * @param {string} [params.afterCursor] Cursor to pass if requesting the next page of records. Takes precedence over beforeCursor.
 * @param {boolean} [params.descending] Whether to sort descending or ascending. Defaults to sort descending.
 * @param {boolean} [params.includeTotalCount] Whether or not to include a total count of all records. Defaults to false for performance.
 * @param {string} [params.idColumn] Name of the primary key column.
 * @param {string} [params.createdAtColumn] Name of the created at column.
 * @param {number} [params.limit] Defaults to 25 and is capped at 100.
 * @param {number} [params.constrainLimit] Whether or not to enforce default and max limits.
 * @param {number} [params.defaultLimit] If constrainLimit is true, default limit to set.
 * @param {number} [params.maxLimit] If constrainLimit is true, max limit to set.
 * @param {Object} [params.where]
 */

export async function findAllPaginated<
  Model,
  ModelInstance extends Sequelize.Instance<ModelAttributes>,
  ModelAttributes,
>(
  model: Sequelize.Model<ModelInstance, ModelAttributes>,
  {
    where,
    bind = {},
    limit,
    createdAtColumn = 'created_at',
    idColumn = 'id',
    order = [createdAtColumn as keyof ModelAttributes, idColumn as keyof ModelAttributes],
    orderProcessors = {
      [createdAtColumn]: dateProcessor,
    },
    beforeCursor,
    afterCursor,
    descending = true,
    includeTotalCount = false,
    constrainLimit = true,
    defaultLimit = 25,
    maxLimit = DEFAULT_MAX_PAGE_SIZE,
    include,
    attributes,
    queryIncludesAssociationAttribute = false,
    ...rest
  }: PaginationParams<Model, ModelAttributes> = {},
): Promise<PaginatedResult<ModelInstance>> {
  const paginationBind: Record<string, string> = {};
  let paginationWhere;
  let moreBefore = false;
  let moreAfter = false;
  let after = true;
  let cursor;

  if (afterCursor) {
    cursor = afterCursor;
  } else if (beforeCursor) {
    cursor = beforeCursor;
    after = false;
  }

  const orderKeys: Array<Sequelize.col | Sequelize.fn> = [];

  if (constrainLimit) {
    limit = setLimit(defaultLimit, maxLimit, limit);
  }

  if (cursor) {
    const operator = getOperator(after, descending);

    const orderValues: string[] = [];
    const cursorValues: string[] = JSON.parse(base64Decode(cursor));
    order.forEach((column, i) => {
      orderKeys.push(
        createOrderColumn<ModelInstance, ModelAttributes>(
          model,
          orderProcessors,
          model.name,
          column,
        ),
      );
      orderValues.push(format(`$%s`, column));

      paginationBind[column as string] = cursorValues[i];
    });

    if (after) {
      moreBefore = true;
    } else {
      moreAfter = true;
    }

    paginationWhere = Sequelize.where(
      Sequelize.fn('', ...orderKeys),
      operator,
      Sequelize.literal(format(`(%s)`, orderValues.join(','))),
    );
  } else {
    order.forEach((column) => {
      orderKeys.push(
        createOrderColumn<ModelInstance, ModelAttributes>(
          model,
          orderProcessors,
          model.name,
          column,
        ),
      );
    });
  }

  let outerWhere;

  if (paginationWhere && where) {
    outerWhere = {
      [and]: [paginationWhere, where],
    };
  } else if (paginationWhere) {
    outerWhere = paginationWhere;
  } else if (where) {
    outerWhere = where;
  }

  const orderDirection = getOrderDirection(after, descending);
  const orderArray = orderKeys.map((orderKey) => [orderKey, orderDirection]);

  const ops: [
    ReturnType<typeof model.findAndCountAll>,
    undefined | ReturnType<typeof model.count>,
  ] = [
    model.findAndCountAll({
      include: queryIncludesAssociationAttribute ? include : [],
      ...rest,
      where: outerWhere,
      limit,
      // Casting because TS types for FindOptionsOrderArray[] doesn't support [Sequelize.fn | Sequelize.col, 'string']
      // Despite it being allowed in the Sequelize docs https://sequelize.org/v4/manual/tutorial/querying.html#ordering.
      order: orderArray as any,
      // @ts-ignore - bind is a hidden property that doesnt exist in the current @types/sequelize
      bind: Object.assign({}, bind, paginationBind),
      subQuery: false,
    }),
    includeTotalCount
      ? model.count({
          include,
          ...rest,
          where,
          attributes: undefined,
          group: undefined,
          // @ts-ignore - bind is a hidden property that doesnt exist in the current @types/sequelize
          bind,
          distinct: true,
          col: idColumn,
        })
      : undefined,
  ];

  const [{ count, rows }, totalCount] = await Promise.all(ops);
  const ids = rows.map((row: any) => row.id);
  // Initial findAll to get ids with limit attribute. Next findAndCountAll will get data along with 'include' based on below found ids //
  const rowsWithAssociations = await model.findAll({
    include,
    attributes,
    ...rest,
    where: { id: { [$in]: ids } },
    order: orderArray as any,
    // @ts-ignore - bind is a hidden property that doesnt exist in the current @types/sequelize
    bind: Object.assign({}, bind, paginationBind),
    subQuery: false,
  });

  // Added validation for count if you pass a group by will no longer return a single number it will return an array
  let itemCount = count;
  if (Array.isArray(count)) {
    itemCount = count.reduce((acc, value) => {
      return acc + Number(value.count);
    }, 0);
  }

  const hasMore = limit != null && itemCount && itemCount > limit;
  if (hasMore) {
    if (after) {
      moreAfter = true;
    } else {
      moreBefore = true;
    }
  }

  if (!after) {
    rowsWithAssociations.reverse();
  }

  const first = rowsWithAssociations[0];
  const last = rowsWithAssociations[rowsWithAssociations.length - 1];
  const newBefore = createCursor<ModelAttributes>(first, order);
  const newAfter = createCursor<ModelAttributes>(last, order);

  return {
    data: rowsWithAssociations,
    before: newBefore,
    after: newAfter,
    moreBefore,
    moreAfter,
    totalCount,
  };
}
