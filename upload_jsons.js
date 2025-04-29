const axios = require('axios');
const jsonUrls = require('./json_urls');
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT || "http://gravitate-health.lst.tfo.upm.es/epi/api/fhir/Library";

if (!SERVER_ENDPOINT) {
    console.error("SERVER_ENDPOINT no está configurado.");
    process.exit(1);
}

async function documentExists(document) {
    try {
        if (!document.identifier[0].value) {
            console.warn('El documento no tiene identifier.value, no se puede comprobar si existe');
            return true; // No queremos subir documentos sin identifier
        }

        const identifierValue = document.identifier[0].value;
        
        // Buscar el documento en el servidor usando el valor del identifier
        const searchUrl = `${SERVER_ENDPOINT}?identifier=${identifierValue}`;
        console.log(`Verificando existencia con: ${searchUrl}`);
        
        const response = await axios.get(searchUrl);
        
        // En FHIR, la respuesta incluye un bundle con total de resultados
        if (response.data && response.data.total > 0) {
            console.log(`Encontrado documento con identifier.value = ${identifierValue}`);
            return true;
        }
        
        console.log(`No se encontró documento con identifier.value = ${identifierValue}`);
        return false;
    } catch (error) {
        console.error(`Error al verificar si existe el documento con identifier.value:`, error.message);
        // Si hay un error, asumimos que el documento no existe
        return false;
    }
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
                
                // Verificar si el documento ya existe
                const exists = await documentExists(jsonData);
                if (exists) {
                    console.log(`El documento de ${jsonUrl} ya existe en el servidor. Omitiendo.`);
                    continue;
                }
                
                console.log(`El documento no existe en el servidor. Procediendo a subirlo.`);
                console.log(`Intentando subir al endpoint: ${SERVER_ENDPOINT}`);

                // Subir el JSON al servidor
                const uploadResponse = await axios.post(SERVER_ENDPOINT, jsonData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                    console.log(`JSON subido exitosamente a ${SERVER_ENDPOINT}`);
                } else {
                    console.error(`Error al subir JSON desde ${jsonUrl}: Status ${uploadResponse.status}`);
                    console.error(`Respuesta del servidor: ${JSON.stringify(uploadResponse)}`);
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