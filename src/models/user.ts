import * as Sequelize from 'sequelize';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export default function (sequelize: Sequelize.Sequelize) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: Sequelize.TEXT,
        primaryKey: true,
        allowNull: false,
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
