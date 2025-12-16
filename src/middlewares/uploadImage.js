import multer from 'multer'
import cloudinary from 'cloudinary'

const storage = multer.memoryStorage();
const upload = multer ({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024// 5 MB
    }
}).single('image');

export const uploadToCloudinary = async (req, res, next) =>{
    try {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        upload(req, res, async (err)=>{
        if (err){
            console.log(err)
            if (err.code == 'LIMIT_FILE_SIZE') {
                return res.status(400).json({message: ['Tamaño del archivo excedido']})
            }
            else 
                return res.status(400).json({message: ['Error al cargar la imagen']})
        } // Fin del if(err)  
        
        if (!req.file)
            return res.status(400).json({message: ['No se encontró la imagen']})


        if (!allowedMimes.includes(req.file.mimetype))
            return res.status(400)
                            .json({message: ['Formato de imagen no permitido']})
        
        // Obtenemos los datos de la imagen del producto almacenada en memoria
        const image = req.file;

        // Convertimos el objeto de la imagen a un objeto base64 para poderlo almacenar como imagen en Cloudinary
        const base64Image = Buffer.from(image.buffer).toString('base64');
        const dataUri = "data:" + image.mimetype +";base64," + base64Image;

        // Subir la imagen a Cloudinary
        const uploadResponse = await cloudinary.v2.uploader.upload(dataUri);
        // Guardamos la URL que retonar Cloudinary en el objeto request
        req.urlImage = uploadResponse.url;
        
                            //console.log(req.file); // Se guarda la imagen en memoria en req.file

        next();
    }); //Fin del upload
    } catch (error) {
        return res.status(400).json({message: [error.message]})
    }
}