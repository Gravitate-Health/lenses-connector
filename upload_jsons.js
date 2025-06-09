const axios = require('axios');
const jsonUrls = require('./json_urls');
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT || "http://gravitate-health.lst.tfo.upm.es/epi/api/fhir/Library";

if (!SERVER_ENDPOINT) {
    console.error("SERVER_ENDPOINT is not configured.");
    process.exit(1);
}

async function documentExists(document) {
    try {
        if (!document.identifier[0].value) {
            console.warn('Document has no identifier.value, cannot check if it exists');
            return true; // We don't want to upload documents without identifier
        }

        const identifierValue = document.identifier[0].value;
        
        // Search for the document on the server using the identifier value
        const searchUrl = `${SERVER_ENDPOINT}?identifier=${identifierValue}`;
        console.log(`Checking existence with: ${searchUrl}`);
        
        const response = await axios.get(searchUrl);
        
        // In FHIR, the response includes a bundle with total results
        if (response.data && response.data.total > 0) {
            console.log(`Found document with identifier.value = ${identifierValue}`);
            return true;
        }
        
        console.log(`No document found with identifier.value = ${identifierValue}`);
        return false;
    } catch (error) {
        console.error(`Error checking if document exists with identifier.value:`, error.message);
        // If there's an error, we assume the document doesn't exist
        return false;
    }
}

async function fetchAndUploadJSONs() {
    try {
        for (const jsonUrl of jsonUrls) {
            try {
                console.log(`Processing: ${jsonUrl}`);

                // Get the JSON from the URL
                const response = await axios.get(jsonUrl);
                const jsonData = response.data;
                
                console.log(`JSON obtained successfully from ${jsonUrl}`);
                
                // Verify if the document already exists
                const exists = await documentExists(jsonData);
                if (exists) {
                    console.log(`Document from ${jsonUrl} already exists on server. Updating.`);
                    const identifierValue = jsonData.identifier[0].value;
                    const searchUrl = `${SERVER_ENDPOINT}?identifier=${identifierValue}`;
                    const response = await axios.get(searchUrl);

                    if (response.data && response.data.total > 0) {
                        jsonData.id = response.data.entry[0].resource.id;
                    }
                    console.log(`Attempting to update endpoint: ${SERVER_ENDPOINT} with id: ${jsonData.id}`);
                    const updateResponse = await axios.put(SERVER_ENDPOINT + `/${jsonData.id}`, jsonData, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    if (updateResponse.status === 200 || updateResponse.status === 201) {
                        console.log(`JSON updated successfully at ${SERVER_ENDPOINT}`);
                    } else {
                        console.error(`Error updating JSON from ${jsonUrl}: Status ${updateResponse.status}`);
                        console.error(`Server response: ${JSON.stringify(updateResponse)}`);
                    }
                }
                
                console.log(`Document does not exist on server. Proceeding to upload.`);
                console.log(`Attempting to upload to endpoint: ${SERVER_ENDPOINT}`);

                // Upload the JSON to the server
                const uploadResponse = await axios.post(SERVER_ENDPOINT, jsonData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                    console.log(`JSON uploaded successfully to ${SERVER_ENDPOINT}`);
                } else {
                    console.error(`Error uploading JSON from ${jsonUrl}: Status ${uploadResponse.status}`);
                    console.error(`Server response: ${JSON.stringify(uploadResponse)}`);
                }
            } catch (urlError) {
                console.error(`Error processing ${jsonUrl}:`);
                console.error(`Message: ${urlError.message}`);
                if (urlError.response) {
                    console.error(`Status: ${urlError.response.status}`);
                    console.error(`Data: ${JSON.stringify(urlError.response.data)}`);
                }
                // Continue with the next URL even if there's an error
                continue;
            }
        }
    } catch (error) {
        console.error("General error during JSON upload:");
        console.error(`Message: ${error.message}`);
        if (error.stack) {
            console.error(`Stack: ${error.stack}`);
        }
    }
}

fetchAndUploadJSONs()
    .then(() => {
        console.log("All JSONs have been processed.");
        process.exit(0); // Terminar con éxito
    })
    .catch((error) => {
        console.error("Error in main function:");
        console.error(`Message: ${error.message}`);
        if (error.stack) {
            console.error(`Stack: ${error.stack}`);
        }
        process.exit(1); // Terminar con error
});