module.exports = (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const restaurantes = [
        {
            "id": 1,
            "nome": "Restaurante Setorial I"
        },
        {
            "id": 2,
            "nome": "Restaurante Setorial II"
        },
        {
            "id": 5,
            "nome": "Restaurante FUMP/CENTRO"
        },
        {
            "id": 6,
            "nome": "Restaurante ICA"
        }
    ];

    res.status(200).json(restaurantes);
};
