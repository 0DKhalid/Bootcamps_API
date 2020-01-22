const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  //take a copy version of req.query
  const reqQuery = { ...req.query };

  // create  array with fields we want remove it from query params
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(field => delete reqQuery[field]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(lt|lte|gt|gte|in)\b/g, match => `$${match}`);

  query = model.find(JSON.parse(queryStr));

  //check if query params has select field
  if (req.query.select) {
    const filterField = req.query.select.split(',').join(' ');
    query = query.select(filterField);
  }

  //check if query has sort field
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  if (populate) {
    query = query.populate(populate);
  }

  //Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  const results = await query;
  //Pagination result to count next and prev data
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResult = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};

module.exports = advancedResults;
