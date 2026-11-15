
const datapea = require('../util/datapea');

const getPlansArray = (result) => {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    return [];
};

exports.getDataPage = async (req, res, next) => {
    try {
        const result = await datapea.fetchDataPlans();

        const dataPlans = getPlansArray(result);

        if (!dataPlans.length) {
            console.log('DATAPEA RESPONSE:', result);
        }

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataPlans,
            errorMessage: null
        });

    } catch (error) {
        console.error(
            'DATAPEA DATA PLANS ERROR:',
            error.response?.data || error.message
        );

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataPlans: [],
            errorMessage: 'Unable to load data plans. Please try again.'
        });
    }
};

exports.getDataPlans = async (req, res, next) => {
    try {
        const network = typeof req.body.network === 'string'
            ? req.body.network.trim()
            : '';

        if (!network) {
            return res.status(400).json({
                status: false,
                message: 'Please select a network.'
            });
        }

        const result = await datapea.fetchDataPlans();
        const plans = getPlansArray(result);

        const filteredPlans = plans.filter(plan =>
            typeof plan.network === 'string' &&
            plan.network.toLowerCase() === network.toLowerCase()
        );

        return res.status(200).json({
            status: true,
            data: filteredPlans
        });

    } catch (error) {
        console.error(
            'DATAPEA FETCH PLANS ERROR:',
            error.response?.data || error.message
        );

        return res.status(502).json({
            status: false,
            message: 'Unable to fetch data plans.'
        });
    }
};
