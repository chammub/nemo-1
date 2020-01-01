const ODataServer = require('simple-odata-server');
const express = require('express');
const app = express();

module.exports = function () {

    // Define Odata model of the resource entity i.e. Product. 
    // The metadata is defined using OData type system called the Entity Data Model (EDM),
    // consisting of EntitySets, Entities, ComplexTypes and Scalar Types.
    var model = {
        namespace: "demo",
        entityTypes: {
            "user": {
                "_id": { "type": "Edm.String", key: true },
                "firstName": { "type": "Edm.String" },
                "lastName": { "type": "Edm.String" }
            }
        },
        entitySets: {
            "users": {
                entityType: "demo.user"
            }
        }
    };

    // Instantiates ODataServer and assigns to odataserver variable.
    const odataServer = ODataServer().model(model);

    // You can quickly set up cors without using express and middlewares using this call
    odataServer.cors('*');

    return odataServer;
}