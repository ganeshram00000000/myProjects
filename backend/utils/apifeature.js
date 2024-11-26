class apiFeature {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    // Method to handle searching by keyword
    search() {
        const keyword = this.queryStr.keyword
            ? {
                name: {
                    $regex: this.queryStr.keyword,
                    $options: "i" // "i" for case-insensitive search
                }
            }
            : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    // Method to handle filtering based on various conditions
    filter() {
        // Copy the query string object to avoid mutation
        const queryCopy = { ...this.queryStr };

        // Fields to remove for filtering
        const removeFields = ["keyword", "page", "limit"];
        removeFields.forEach((key) => delete queryCopy[key]);

        // Convert operators (gt, gte, lt, lte) to MongoDB format ($gt, $gte, etc.)
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
        
        this.query = this.query.find(JSON.parse(queryStr));

        // Handle rating filter
        if (this.queryStr.rating) {
            this.query = this.query.find({ rating: { $gte: Number(this.queryStr.rating) } });
        }

        return this;
    }

    // Method to handle pagination
    pagination(resultsPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resultsPerPage * (currentPage - 1);

        this.query = this.query.limit(resultsPerPage).skip(skip);
        return this;
    }
}

module.exports = apiFeature;
