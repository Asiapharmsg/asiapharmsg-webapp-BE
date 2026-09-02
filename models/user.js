
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image_moh: {
        type: DataTypes.BLOB,
        allowNull: false,
      },
      image_smc: {
        type: DataTypes.BLOB,
        allowNull: false,
      },
      image_acra: {
        type: DataTypes.BLOB,
        allowNull: false,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyPostal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("Active", "Pending", "Rejected", "Closed"),
        defaultValue: "Pending",
      },
      billingType: {
        type: DataTypes.ENUM(
          "Cash on Delivery",
          "30 days payment period",
          "60 days payment period",
          "Invalid"
        ),
      },
      priceTier: {
        type: DataTypes.ENUM(
          "Usual price",
          "10 off",
          "20 off",
          "Invalid (for supplier account)"
        ),
      },
      adminControl: {
        type: DataTypes.ENUM(
          "Normal clinic",
          "Normal vendor",
          "Advance clinic",
          "Advance vendor",
          "Special clinic",
          "Special vendor"
        ),
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      licenceExpiryDate:{
        allowNull: true,
        type: DataTypes.DATE,
      },
      nationality: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      countryIncorporation: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      deliveryAddress: {
        type: DataTypes.STRING,
        allowNull: false
      },
      deliveryPostal: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    { underscored: true }
  );

  return User;
};
