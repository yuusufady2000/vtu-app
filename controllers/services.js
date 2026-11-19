const { fetchDataPlans } = require('../util/datapea');

exports.getBuyData = (req, res, next) => {
    fetchDataPlans()
        .then(plans => {
            res.render('shop/data.ejs', {
                pageTitle: 'Buy data',
                plans,
                path: '/data'
            });
        })
        .catch(next);
};

exports.postDataPlans = (req, res, next) => {
    fetchDataPlans()
        .then(plans => {
            res.json(plans);
        })
        .catch(next);
};