import fetch from 'node-fetch';

export const reverseGeocode = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Latitude and longitude are required'
            });
        }

        // Hacer petición a Nominatim desde el servidor
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'AnimalRescue/1.0 (contact@animalrescue.pe)', // IMPORTANTE
                'Accept-Language': 'es',
            },
        });

        if (!response.ok) {
            throw new Error('Geocoding service error');
        }

        const data = await response.json();

        // Formatear respuesta
        const address = data.address || {};
        const formattedAddress = [
            address.road,
            address.house_number,
            address.suburb || address.neighbourhood,
        ]
            .filter(Boolean)
            .join(', ') || data.display_name;

        res.json({
            success: true,
            address: formattedAddress,
            district: address.city || address.town || address.village || address.suburb || 'Chincha',
            province: address.state || address.province || 'Ica',
            country: address.country || 'Perú',
            raw: data, // Por si necesitas más detalles
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({
            error: 'Error getting address',
            message: error.message
        });
    }
};