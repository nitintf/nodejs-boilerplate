import { Nullable } from 'app/types';
import Sequelize from 'sequelize';
import { User } from './user';

type ListAttributes = {
  id?: string;
  entityType: string;
  entityId: string;
  transactionId: number;
  query: string;
  queryType: string;
  activity?: Nullable<string>;
  oldData?: any;
  newData?: any;
  userId?: Nullable<string>;
  userType?: Nullable<string>;
  timestamp?: Date;
};

export type ListInstanceAttributes = Required<ListAttributes> & {
  user?: User;
};

export interface ListInstance
  extends Sequelize.Instance<ListInstanceAttributes>,
    ListInstanceAttributes {}

export type List = Sequelize.Model<ListInstance, ListAttributes>;

export default function (sequelize: Sequelize.Sequelize) {
  const List = sequelize.define<ListInstance, ListAttributes>(
    'List',
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      entityType: {
        field: 'entity_type',
        type: Sequelize.TEXT,
        allowNull: false,
      },
      entityId: {
        field: 'entity_id',
        type: Sequelize.TEXT,
        allowNull: false,
      },
      transactionId: {
        field: 'transaction_id',
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      query: {
        field: 'query',
        type: Sequelize.TEXT,
        allowNull: false,
      },
      queryType: {
        field: 'query_type',
        type: Sequelize.TEXT,
        allowNull: false,
      },
      activity: {
        field: 'activity',
        type: Sequelize.TEXT,
        allowNull: true,
      },
      oldData: {
        field: 'old_data',
        type: Sequelize.JSONB,
        allowNull: true,
      },
      newData: {
        field: 'new_data',
        type: Sequelize.JSONB,
        allowNull: true,
      },
      userId: {
        field: 'user_id',
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'list',
      paranoid: false,
      underscored: true,
    },
  );

  List.belongsTo(sequelize.models.User, {
    as: 'user',
    foreignKey: {
      allowNull: true,
      field: 'user_id',
      name: 'userId',
    },
  });

  return List;
}
