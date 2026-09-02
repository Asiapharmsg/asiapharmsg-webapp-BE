const getCompleteOrderStatus = (statuses) => {
  if (statuses.every((od) => od == 1)) return 1;
  else if (statuses.every((od) => od == 2)) return 2;
  else if (statuses.every((od) => od == 3)) return 3;
  else return 5;
};

module.exports = {
  getCompleteOrderStatus
};
