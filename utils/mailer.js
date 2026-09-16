var nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const OrderDetail = require('./../productModels/OrderDetail.model');
const Product = require('./../productModels/Product.model');
const moment = require('moment');
const path = require('path');

// Sender must be an address on the SES identity we own (mail.asiapharmsg.com).
// The parent domain still belongs to Microsoft 365 and is never sent as.
const MAIL_FROM =
  process.env.EMAIL_FROM || '"AsiaPharm SG Admin" <no-reply@mail.asiapharmsg.com>';
// no-reply is not a real mailbox, so replies go to a person instead.
const MAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'melcia@asiapharmsg.com';
/*
const {google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(process.env.EMAIL_CLIENTID, process.env.EMAIL_CLIENT_SECRET, process.env.REDIRECT_URL)
oAuth2Client.setCredentials({ refreshToken: process.env.REFRESH_TOKEN})

const accessToken = await oAuth2Client.getAccessToken()

var transporter = nodemailer.createTransport({
  service:'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_ADDR,
    clientId: process.env.EMAIL_CLIENTID,
    clientSecret: process.env.EMAIL_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken,
  }
});*/

// SES through the instance role: there is no SMTP user or password to store,
// rotate or leak. Credentials come from the EC2 instance profile at runtime.
var transporter = nodemailer.createTransport(
  {
    SES: new aws.SES({
      apiVersion: '2010-12-01',
      region:
        process.env.SES_REGION || process.env.AWS_REGION || 'ap-southeast-1'
    })
  },
  {
    from: MAIL_FROM,
    replyTo: MAIL_REPLY_TO
  }
);

// Notification mail must never fail the action that triggered it, but a
// failure has to be visible. Every failure logs one greppable line rather
// than disappearing into a bare console.log, and the caller gets a boolean.
const deliver = async (label, mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`MAIL OK [${label}] -> ${mailOptions.to} (${info.messageId})`);
    return true;
  } catch (err) {
    console.error(
      `MAIL FAILURE [${label}] -> ${mailOptions.to}: ${err.message}`
    );
    return false;
  }
};

const sendMail = async (email) => {
  const mailOptions = {
    from: MAIL_FROM,
    to: email,
    subject: 'Pending account activation - AsiaPharmSG',
    text: 'That was easy! Our team is currently reviewing your application. Thank you!'
  };

  return deliver('signup-pending', mailOptions);
};

const sendResetMail = async (user, hasedResetString, redirectUrl) => {
  const mailOptionsForReset = {
    from: MAIL_FROM,
    to: user.email,
    subject: 'Password Reset',
    html: `<p>We have heard that you lost the password.</p><p>Don't worry, use the link below to reset it.</p>
    <p>This link <b>expires in 1 hour</b>. </p><p>Press <a href=${
      redirectUrl + '/' + user.id + '/' + hasedResetString
    }>
    here</a> to proceed. </p>`
  };
  return deliver('password-reset-link', mailOptionsForReset);
};

const sendTempPasswordMail = async (email, password) => {
  const mailOptionsForReset = {
    from: MAIL_FROM,
    to: email,
    subject: 'AsiaPharm Platform Account Password Reset',
    html: `<p>We have heard that you lost the password.</p><p>Don't worry, we have generate a temporary password.
    Please reset your password immediately after logging in with the temporary password.</p>
    <p><b>Your Temporary Password : </b> </p><p>${password}</p>`
  };
  // Throws on failure on purpose: the caller must not change the stored
  // password unless the temporary one actually reached the user.
  const info = await transporter.sendMail(mailOptionsForReset);
  console.log('Temp password email sent: ' + info.messageId);
  return info;
};

//Send Email when account is active
const sendAccountUpdateSuccessMail = async (email) => {
  const mailOptionsForUpdateSuccess = {
    from: MAIL_FROM,
    to: email,
    subject: 'Your Account Registration is successful',
    html: `<p>Your Account has been activated.</p>`
  };
  return deliver('account-approved', mailOptionsForUpdateSuccess);
};

//Send Email when account is rejected
const sendAccountUpdateUnsuccessMail = async (email) => {
  const mailOptionsForUpdateUnsuccess = {
    from: MAIL_FROM,
    to: email,
    subject: 'Your Account Registration is unsuccessful',
    html: `<p>We regret to inform you that your application has been rejected. Please contact our admin for verification. </p>`
  };
  return deliver('account-rejected', mailOptionsForUpdateUnsuccess);
};

//Send Email when order is created
const sendNewOrderMail = async (email) => {
  const mailOptionsForNewOrder = {
    from: MAIL_FROM,
    to: email,
    subject: 'An order has been created',
    html: `<p>The order has been created and is in pending status. Please check your account to view the order. </p>`
  };
  return deliver('order-created', mailOptionsForNewOrder);
};

//Send Email when order is approve
const sendApproveOrderMail = async (user, order) => {
  console.log(order);

  const oid = order.dataValues.id;
  const createdAt = moment(order.dataValues.createdAt)
    .utcOffset('+0800')
    .format('DDMMYYYYHHMMss');
  /*var order_id =
    createdAt
      .toISOString()
      .replace(/T/, '')
      .replace(/:/g, '')
      .replace(/-/g, '')
      .replace(/\..+/, '') + oid;*/

  let sample = createdAt;
  let order_id = sample + oid;

  //build table in email
  let message =
    '<p> Hi ' +
    user.username +
    ', </br></br> We’re happy to let you know that your order ' +
    order_id +
    ' has been approved.' +
    '</br></br>';

  message +=
    '<p>If you have any questions, contact us here or call us on 6547 8077!';

  message += '<h3> Thank you for placing your order. </h3>';

  const mailOptionsForRejectOrder = {
    from: MAIL_FROM,
    to: user.email,
    subject: `Your order [${order_id}] has been approved`,
    html: message
  };
  return deliver('order-approved', mailOptionsForRejectOrder);
};

//Send Email when order is rejected
const sendRejectOrderMail = async (user, order) => {
  const oid = order.dataValues.id;
  const createdAt = moment(order.dataValues.createdAt)
    .utcOffset('+0800')
    .format('DDMMYYYYHHMMss');
  /*var order_id =
    createdAt
      .toISOString()
      .replace(/T/, '')
      .replace(/:/g, '')
      .replace(/-/g, '')
      .replace(/\..+/, '') + oid;*/

  let sample = createdAt;
  let order_id = sample + oid;

  //build table in email
  let message =
    '<p> Hi ' +
    user.username +
    ', </br></br> We regret to inform you that your order ' +
    order_id +
    ' has not been approved. There is at least one order detail been rejected.' +
    'Please log in to your account to see full information about this order. ' +
    '</br></br>';

  message +=
    '<p>If you have any questions, contact us here or call us on 6547 8077!';

  message += '<h3> Please place your order with us again. Thank you. </h3>';

  const mailOptionsForRejectOrder = {
    from: MAIL_FROM,
    to: user.email,
    subject: `Your order [${order_id}] has at least one order item been rejected`,
    html: message
  };
  return deliver('order-rejected', mailOptionsForRejectOrder);
};

// sending email with table for user
const sendNewOrderMailTemplate = async (user, newOrder, orderDetails_list) => {
  console.log(newOrder.id, 'inside sendNewOrderMailTemplate');
  const oid = newOrder.dataValues.id;
  const createdAt = moment(newOrder.dataValues.createdAt)
    .utcOffset('+0800')
    .format('DDMMYYYYHHMMss');
  /*var order_id =
    createdAt
      .toISOString()
      .replace(/T/, '')
      .replace(/:/g, '')
      .replace(/-/g, '')
      .replace(/\..+/, '') + oid;*/

  let sample = createdAt;
  let order_id = sample + oid;

  /*let rows = await OrderDetail.findAll({
    where: {order_id : oid }
   });*/

  const test = JSON.parse(orderDetails_list);
  var product_list = [];
  for (const x in test) {
    let row = await Product.findByPk(test[x].product_id);
    console.log('iam printing here', row.id);
    product_list.push(row.dataValues.name);
  }
  //console.log("printing product list ", product_list);

  //build table in email
  let message =
    '<p> Hi ' +
    user.username +
    ', </br></br> We’re happy to let you know that we’ve received your order.' +
    '</br></br><p>Once your order has been confirmed, we will send you an email with updated status!</p> ' +
    '</br><img src="cid:unique@cid" width=150 height=150></img>' +
    '<h1>NEW ORDER ' +
    order_id +
    '</h1>' +
    '<table style="border: 1px solid #333;">' +
    '<thead>' +
    '<th>Order Summary: </th>' +
    '</thead>' +
    '<tbody>' +
    '<tr>' +
    '<td> Product Name </td>' +
    '<td> Quantity </td>' +
    '<td> Price</td>' +
    '<td> Status </td>' +
    '</tr>';

  for (const x in test) {
    console.log(test[x]);
    message +=
      '<tr>' +
      '<td>' +
      product_list[x] +
      '</td>' +
      '<td>' +
      test[x].quantity +
      '</td>' +
      '<td>' +
      test[x].price +
      '</td>' +
      '<td> Pending</td>' +
      '</tr>';
  }

  message +=
    '<tr>' +
    '<td> Total price </td>' +
    '<td> - </td>' +
    '<td>' +
    newOrder.dataValues.total_price +
    '</td>' +
    '<td> - </td>' +
    '</tr>';

  message += '</tbody>';
  message += '</table>';
  message +=
    '<p>If you have any questions, contact us here or call us on 6547 8077!';
  message += '<h3> Thank you for placing your order. </h3>';

  const mailOptionsForNewOrder = {
    from: MAIL_FROM,
    to: user.email,
    subject: `An order has been created[${order_id}]`,
    attachments: [
      {
        filename: 'AsisPharmLogo.jpeg',
        path: path.join(__dirname, 'AsisPharmLogo.jpeg'),
        cid: 'unique@cid'
      }
    ],
    html: message
  };
  return deliver('order-placed-clinic', mailOptionsForNewOrder);
};

// sending email with table for vendor
const sendNewOrderMailVendor = async (vendor, newOrder, orderDetails_list) => {
  const oid = newOrder.dataValues.id;
  const createdAt = moment(newOrder.dataValues.createdAt)
    .utcOffset('+0800')
    .format('DDMMYYYYHHMMss');
  /*var order_id =
    createdAt
      .toISOString()
      .replace(/T/, '')
      .replace(/:/g, '')
      .replace(/-/g, '')
      .replace(/\..+/, '') + oid;*/

  let sample = createdAt;
  let order_id = sample + oid;

  /*let rows = await OrderDetail.findAll({
    where: {order_id : oid }
   });*/

  const test = JSON.parse(orderDetails_list);
  var product_list = [];
  var order_list_for_vendor = [];
  var total_price = 0;
  for (const x in test) {
    let row = await Product.findByPk(test[x].product_id);
    console.log('iam printing here', row.id);
    if (vendor.id == row.dataValues.supplier_id) {
      product_list.push(row.dataValues.name);
      order_list_for_vendor.push(test[x]);
    }
  }
  console.log('printing product list ', product_list);

  //build table in email
  let message =
    '<p> Hi ' +
    vendor.username +
    ', </br></br> We’re happy to let you know that you have an order.' +
    '</br></br><p>Once your order has been confirmed, we will send you an email with updated status! ' +
    '<h1>NEW ORDER ' +
    order_id +
    '</h1>' +
    '<table style="border: 1px solid #333;">' +
    '<thead>' +
    '<th>Order Summary: </th>' +
    '</thead>' +
    '<tbody>' +
    '<tr>' +
    '<td> Product Name </td>' +
    '<td> Quantity </td>' +
    '<td> Price</td>' +
    '<td> Status </td>' +
    '</tr>';

  for (const x in order_list_for_vendor) {
    console.log(order_list_for_vendor[x]);
    total_price += Number(order_list_for_vendor[x].price);
    message +=
      '<tr>' +
      '<td>' +
      product_list[x] +
      '</td>' +
      '<td>' +
      order_list_for_vendor[x].quantity +
      '</td>' +
      '<td>' +
      order_list_for_vendor[x].price +
      '</td>' +
      '<td> Pending</td>' +
      '</tr>';
  }

  message +=
    '<tr>' +
    '<td> Total price </td>' +
    '<td> - </td>' +
    '<td>' +
    total_price +
    '</td>' +
    '<td> - </td>' +
    '</tr>';

  message += '</tbody>';
  message += '</table>';
  message +=
    '<p>If you have any questions, contact us here or call us on 6547 8077!';
  message += '<h3> Thank you for placing your order. </h3>';

  const mailOptionsForNewOrder = {
    from: MAIL_FROM,
    to: vendor.email,
    subject: `You got an order[${order_id}]`,
    html: message
  };
  return deliver('order-placed-vendor', mailOptionsForNewOrder);
};

module.exports = {
  sendMail,
  sendResetMail,
  sendTempPasswordMail,
  sendAccountUpdateSuccessMail,
  sendAccountUpdateUnsuccessMail,
  sendNewOrderMail,
  sendApproveOrderMail,
  sendRejectOrderMail,
  sendNewOrderMailTemplate,
  sendNewOrderMailVendor
};
