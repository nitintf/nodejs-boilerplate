import Sequelize from 'sequelize';

export type UserAttributes = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export interface UserInstance extends Sequelize.Instance<UserAttributes>, UserAttributes {}

export type User = Sequelize.Model<UserInstance, UserAttributes>;

export default function (sequelize: Sequelize.Sequelize): User {
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
