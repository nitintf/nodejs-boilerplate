import * as Sequelize from 'sequelize';
export interface UserAttributes {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export type UserInstanceAttributes = Required<UserAttributes> & {};

export interface UserInstance extends Sequelize.Instance<UserInstanceAttributes>, UserAttributes {}

export type User = Sequelize.Model<UserInstance, UserAttributes>;

export default function (sequelize: Sequelize.Sequelize) {
  const User = sequelize.define<UserInstance, UserAttributes>(
    'User',
    {
      id: {
        type: Sequelize.TEXT,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'last_name',
      },
      password: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
    },
  );

  return User;
}
