
const vtugate = require('../vtu_api/data');

exports.getDataPage = async (req, res, next) => {
    try {
        const result = await vtugate.fetchAllServices();

        if (!result.status) {
            throw new Error('Unable to retrieve VTUGATE services');
        }

        const dataServices = result.data.filter(
            service => service.service_type === 'data'
        );

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataServices
        });

    } catch (error) {
        console.error(
            'Fetch All Services Error:',
            error.response?.data || error.message
        );

        res.status(502).render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataServices: [],
            errorMessage: 'Unable to load data networks. Please try again.'
        });
    }
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

        res.json(result);

    } catch (error) {
        console.error(
            'VTUGATE Error:',
            error.response?.data || error.message
        );

        res.status(502).json({
            status: false,
            message: 'Unable to fetch data plans'
        });
    }
};
