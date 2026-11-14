
const vtugate = require('../util/vtugate');

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

exports.getDataPage = async (req, res, next) => {
    try {
        const result = await vtugate.fetchAllServices();

        console.log('VTUGATE SERVICES RESPONSE:', result);

        if (!result.status) {
            throw new Error(result.message || 'VTUGATE returned unsuccessful status');
        }

        const dataServices = (result.data || []).filter(
            service => service.service_type === 'data'
        );

        console.log('DATA SERVICES:', dataServices);

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataServices
        });

    } catch (error) {
        console.error('FETCH ALL SERVICES ERROR:', {
            message: error.message,
            status: error.response?.status,
            response: error.response?.data
        });

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataServices: [],
            errorMessage: 'Unable to load data networks. Please try again.'
        });
    }
};
