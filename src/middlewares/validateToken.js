import { TOKEN_SECRET } from "../config.js";
import jwt from 'jsonwebtoken';

export const authRequired = (req, res, next) =>{
    //console.log("validando token");
    const {token} = req.cookies;

    if (!token) // Si no hay un token
        return res.status(401).json({message: ["No token, autorización denegada"]})

    //Verificamos el token
    jwt.verify(token, TOKEN_SECRET, (err, user)=>{
        if(err) //Si hay error al validar el token
            return res.status(403).json({message: ["Token invalido"]});
        //Si no hay error en el token, imprimimos el usuario que inició sesión
        req.user=user;
        next();
    })
}