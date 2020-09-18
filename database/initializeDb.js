let db = require("./db")
let mongo = require("mongodb")

function initialize(
    server,
    dbName,
    dbCollectionName,
) {
    db.initialize(dbName, dbCollectionName, function (dbCollection) { // successCallback

        // << db CRUD routes >>

        server.post(`/api/${dbCollectionName}`, (request, response) => {
            const item = request.body;
            dbCollection.insertOne(item, (error, result) => { // callback of insertOne
                if (error) throw error;
                // return updated list
                dbCollection.find().toArray((_error, _result) => { // callback of find
                    if (_error) throw _error;
                    response.json(_result);
                });
            });
        });

        server.get(`/api/${dbCollectionName}/:id`, (request, response) => {
            const itemId = request.params.id;

            dbCollection.findOne({ _id: mongo.ObjectId(itemId) }, (error, result) => {
                if (error) throw error;
                // return item
                response.json(result);
            });
        });

        server.get(`/api/${dbCollectionName}`, (request, response) => {
            // return updated list
            dbCollection.find().toArray((error, result) => {
                if (error) throw error;
                response.json(result);
            });
        });

        server.put(`/api/${dbCollectionName}/:id`, (request, response) => {
            const itemId = request.params.id;
            const item = request.body;
            console.log("Editing item: ", itemId, " to be ", item);

            dbCollection.updateOne({ _id: mongo.ObjectId(itemId) }, { $set: item }, (error, result) => {
                if (error) throw error;
                // send back entire updated list, to make sure frontend data is up-to-date
                dbCollection.find().toArray(function (_error, _result) {
                    if (_error) throw _error;
                    response.json(_result);
                });
            });
        });


        server.delete(`/api/${dbCollectionName}/:id`, (request, response) => {
            const itemId = request.params.id;

            dbCollection.deleteOne({ _id: mongo.ObjectId(itemId) }, function (error, result) {
                if (error) throw error;
                // send back entire updated list after successful request
                dbCollection.find().toArray(function (_error, _result) {
                    if (_error) throw _error;
                    response.json(_result);
                    console.log("Delete item with id: ", itemId, result.deletedCount);

                });
            });
        });

    }, function (err) { // failureCallback
        throw (err);
    });
}

module.exports = {
    initialize
};