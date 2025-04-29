const axios = require('axios');
const jsonUrls = require('./json_urls');
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT;

if (!SERVER_ENDPOINT) {
    console.error("SERVER_ENDPOINT no está configurado.");
    process.exit(1);
}

async function fetchAndUploadJSONs() {
    try {
        for (const jsonUrl of jsonUrls) {
            try {
                console.log(`Procesando: ${jsonUrl}`);

                // Obtener el JSON desde la URL
                const response = await axios.get(jsonUrl);
                const jsonData = response.data;
                
                console.log(`JSON obtenido correctamente desde ${jsonUrl}`);
                console.log(`Intentando subir al endpoint: ${SERVER_ENDPOINT}`);

                // Subir el JSON al servidor
                const uploadResponse = await axios.post(SERVER_ENDPOINT, jsonData);

                if (uploadResponse.status === 200) {
                    console.log(`JSON subido exitosamente desde ${jsonUrl}`);
                } else {
                    console.error(`Error al subir JSON desde ${jsonUrl}: Status ${uploadResponse.status}`);
                    console.error(`Respuesta del servidor: ${JSON.stringify(uploadResponse.data)}`);
                }
            } catch (urlError) {
                console.error(`Error procesando ${jsonUrl}:`);
                console.error(`Mensaje: ${urlError.message}`);
                if (urlError.response) {
                    console.error(`Status: ${urlError.response.status}`);
                    console.error(`Data: ${JSON.stringify(urlError.response.data)}`);
                }
                // Continuamos con la siguiente URL aunque haya error
                continue;
            }
        }
    } catch (error) {
        console.error("Error general durante la subida de JSON:");
        console.error(`Mensaje: ${error.message}`);
        if (error.stack) {
            console.error(`Stack: ${error.stack}`);
        }
    }
}

fetchAndUploadJSONs()
    .then(() => {
        console.log("Todos los JSONs han sido procesados.");
    })
    .catch((error) => {
        console.error("Error en la función principal:");
        console.error(`Mensaje: ${error.message}`);
        if (error.stack) {
            console.error(`Stack: ${error.stack}`);
        }
    });