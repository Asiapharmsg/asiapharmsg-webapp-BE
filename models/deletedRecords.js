module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'DeletedRecord',
    {
      username: {
        allowNull: false,
        type: DataTypes.STRING
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      mobile: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      accountType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      image_moh: {
        type: DataTypes.BLOB,
        allowNull: false
      },
      image_smc: {
        type: DataTypes.BLOB,
        allowNull: false
      },
      image_acra: {
        type: DataTypes.BLOB,
        allowNull: false
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyAddress: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyPostal: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('Active', 'Pending', 'Rejected', 'Closed'),
        defaultValue: 'Pending'
      },
      billingType: {
        type: DataTypes.ENUM(
          'Cash on Delivery',
          '30 days payment period',
          '60 days payment period'
        )
      },
      priceTier: {
        type: DataTypes.ENUM('Basic', 'Standard', 'Professional')
      },
      adminControl: {
        type: DataTypes.ENUM('Super admin', 'Basic user', 'Standard user')
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      deletedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
    { underscored: true }
  );

  return User;
};
