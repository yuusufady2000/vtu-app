
const vtugate = require('../vtu_api/data');


exports.getDataPage = (req, res) => {
  res.render('shop/data', {
    pageTitle: 'Buy Data',
    path: '/buy-data'
  });
};

exports.getDataPlans = async (req, res, next) => {
  try {
    const serviceId = Number(req.body.service_id);

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return res.status(400).json({
        status: false,
        message: 'Invalid service ID'
      });
    }

    const result = await vtugate.fetchDataPlans(serviceId);

    if (!result.status) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('VTUGATE Error:', error.response?.data || error.message);

    res.status(error.response?.status || 502).json({
      status: false,
      message: 'Unable to fetch data plans'
    });
  }
};
