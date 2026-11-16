
const datapea = require('../util/datapea');

const getPlansArray = (result) => {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.plans)) {
        return result.plans;
    }

    return [];
};

exports.getDataPage = async (req, res, next) => {
    try {
        const result = await datapea.fetchDataPlans();
        const dataPlans = getPlansArray(result);

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataPlans,
            errorMessage: null
        });

    } catch (error) {
        console.error('DATAPEA PLANS ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataPlans: [],
            errorMessage: 'Unable to load data plans. Please try again.'
        });
    }
};

exports.getDataPlans = async (req, res) => {
    try {
        const network = String(req.body.network || '').trim();
        const type = String(req.body.type || '').trim();

        if (!network) {
            return res.status(400).json({
                status: false,
                message: 'Please select a network.'
            });
        }

        const result = await datapea.fetchDataPlans();
        const plans = getPlansArray(result);

        const filteredPlans = plans.filter(plan => {
            const networkMatches =
                String(plan.network || '').toLowerCase() === network.toLowerCase();

            const typeMatches = !type ||
                String(plan.type || '').toLowerCase() === type.toLowerCase();

            return networkMatches && typeMatches;
        });

        return res.status(200).json({
            status: true,
            count: filteredPlans.length,
            data: filteredPlans
        });

    } catch (error) {
        console.error('DATAPEA FETCH PLANS ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(502).json({
            status: false,
            message: 'Unable to fetch data plans.',
            error: error.response?.data || error.message
        });
    }
};

exports.postBuyData = async (req, res) => {
    try {
        const phone = String(req.body.phone || '').trim();
        const network = req.body.network;
        const planId = req.body.planId;

        if (!phone || !/^0\d{10}$/.test(phone)) {
            return res.status(400).json({
                status: false,
                message: 'Enter a valid 11-digit phone number.'
            });
        }

        if (
            network === undefined ||
            network === null ||
            !Number.isInteger(Number(network))
        ) {
            return res.status(400).json({
                status: false,
                message: 'A valid numeric network ID is required.'
            });
        }

        if (
            planId === undefined ||
            planId === null ||
            !Number.isInteger(Number(planId))
        ) {
            return res.status(400).json({
                status: false,
                message: 'Please select a valid data plan.'
            });
        }

       const result = await datapea.purchaseData({
    network,
    phone,
    plan_id: planId,
    requestId: `data_${require('crypto').randomUUID()}`
});

        return res.status(200).json({
            status: true,
            message: 'Datapea purchase request submitted.',
            data: result
        });

    } catch (error) {
        console.error('DATAPEA PURCHASE ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(error.response?.status || 502).json({
            status: false,
            message: 'Unable to process the data purchase.',
            error: error.response?.data || error.message
        });
    }
};
