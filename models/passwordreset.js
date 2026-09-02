module.exports = (sequelize, DataTypes) => {
  const PaswordReset = sequelize.define(
    "PasswordReset",
    {
      userid: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      resetString: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      expiryAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    { underscored: true }
  );

  return PaswordReset;
};
