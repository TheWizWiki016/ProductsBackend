import Products from '../models/product.models.js';
import Orders from '../models/order.model.js';

//Funcion para crear una orden
export const createOrder = async (req,res) => {
    try {
        const {
            items,
            paymentMethod,
            subTotal,
            iva,
            total,
            totalProducts,
        } = req.body;

        //Validar stock en la base de datos
        for (const item of items) {
            const product = await Products.findById(item.productId);
            if(!product || product.quantity < item.quantity){
                if(!product)
                    return res.status(400)
                .json({message: ['Producto '+ item.productId + ' no encontrado en la base de datos']})
                else
                    return res.status(400)
                .json({message: ['No hay suficiente stock en existencia para el producto '+ product.name]})
            }//if
        }//for

        //Crear el pedido
        const order = await Orders.create({
            user: req.user.id,
            items: items.map( item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            })),
            subTotal,
            iva,
            total,
            totalProducts,
            paymentMethod,
            status: 'received',
            timestamps: Date.now()
        })//Fin de objeto order

        //Guardamos la orden
        const newOrder = await order.save();

        //Actualizar el stock de la base de datos 
        await Promise.all(items.map(async item =>{
            await Products.findByIdAndUpdate(item.productId, {
                $inc: {quantity: -item.quantity}
            });
        }));

        res.json(newOrder)
    } catch (error) {
        console.log(error);
        res.status(500)
        .json({message:['Error al crear la orden']})
        
    }
};//Fin de createOrder

//Funcion para actualizar el status de una orden 
export const updateOrderStatus = async (req,res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        //Validar el estado
        if(!['received','confirmed','cancelled','delivered'].includes(status)){
            return res.status(400)
            .json({message:['Error al actualizar la orden, estado no valido']})
        }

        //Buscar y actualizar la orden
        const order = await Orders.findByIdAndUpdate(id, {status}, {new:true})

        if(!order){
            return res.status(400)
            .json({message:['Error al actualizar la orden, orden no encontrada']})
        }
        
        //Si se cancela la orden, restaurar stock 
        if(status === 'cancelled' && order.status !== 'cancelled'){
            await Promise.all(order.items.map(async item => {
                await Products.findByIdAndUpdate(item.productId, {
                    $inc: {quantity: item.quantity}//Sumar de vuelta al stock los productos cancelados
                });
            }));
        }

        res.json(order);
    } catch (error) {
        return res.status(400)
        .json({message:['Error al actualizar la orden']})
    }
};//Fin de updateOrderStatus

//Funcion para obtener todas las ordenes para el administrador 
export const getAllOrders = async (req,res) => {
    try {
        //Obtener todas las ordenes
        const orders = await Orders.find()
        .sort({createdAt: -1})
        .populate({
            path: 'items.productId',
            model: 'Product',
            select: 'name price image quantity'
        });
        res.json(orders);
    } catch (error) {
        return res.status(400)
        .json({message:['Error al obtener todas las ordenes']})
    }
}; //Fin de getAllOrders

//Funcion para obtener todas las ordenes para un usuario
export const getUserOrders = async (req,res) => {
    try {
        //Obtener todas las ordenes para un usuario especifico
        const orders = await Orders.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'items.productId',
                model: 'Product',
                select: 'name price image quantity'
            });

        // Siempre responde con el arreglo (aunque esté vacío)
        return res.json(orders);  
    } catch (error) {
        console.log(error);
        return res.status(400)
            .json({ message: ['Error al obtener todas las ordenes'] });
    }
};


//Funcion para obtener una orden por ID
export const getOrderById = async (req,res) => {
    try {
        //Obtener una orden por ID
        const order = await Orders.findById(req.params.id)
        .populate({
            path: 'items.productId',
            model: 'Product',
            select: 'name price image quantity'
        });

        if (!order)//No se encontro la orden
        return res.status(400)
        .json({message: ['Error, no se encontro la orden']})

        res.json(order);
    } catch (error) {
        return res.status(400)
        .json({message:['Error al obtener la orden']})
    }
};//Fin de getAllOrders

//Función para eliminar una orden solo si el status es cancelado
export const deleteOrder = async (req, res) => {
    try {

        //Obtener una orden por ID para validar su estado
        const order = await Orders.findById(req.params.id)
        if (!order) { //No se encontró la orden
            return res.status(404)
                .json({ message: ['Error, no se encontró la orden para eliminar'] })
        }

        if (order.status !== 'cancelled') {
            return res.status(400)
                .json({ message: ['Error, solo se pueden eliminar órdenes canceladas'] });
        }

        //Eliminar una orden por ID
        await Orders.findByIdAndDelete(req.params.id)

        res.json(order);

    } catch (error) {
        return res.status(400)
            .json({ message: ['Error al obtener la orden'] })
    }
};
//Fin de deleteOrder
