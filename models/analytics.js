module.exports = (sequelize, DataTypes) => {
  const Analytics = sequelize.define(
    'Analytics',
    {
      date: {
        allowNull: false,
        type: DataTypes.DATE,
        primaryKey: true
      },
      action: {
        allowNull: false,
        type: DataTypes.STRING
      },
      count: {
        allowNull: false,
        type: DataTypes.INTEGER
      }
    },
    {
      tableName: 'analytics',
      timestamps: false
    }
  );
  return Analytics;
};
