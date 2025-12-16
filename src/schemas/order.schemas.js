import {z} from 'zod';



//Esquema para los items del carrito
const cartItemSchema = z.object({
    productId: z.string ('El id del producto es requerido')
    .min(1, {
        error: 'El id del producto no es valido'
    }),
    quantity: z.string()
    .transform( (val) => parseInt(val))
    .pipe (
        z.number('Cantidad de producto requerido')
        .positive('Cantidad debe de ser mayor a 0')
        .refine ((val) => !isNaN(val), {error:'Cantidad debe ser un numero valido'})
    ),
    price: z.string()
    .transform( (val) => parseFloat(val))
    .pipe (
        z.number()
        .int({error:'Precio del producto requerida'})
        .min(0,{error:'Precio debe ser mayor o igual a 0'})
        .refine((val) => !isNaN(val), {error: 'Precio debe ser un numero valido'})
        ),
});

//Esquema para los detalles de la tarjeta
const cardDetailsSchema = z.object({
    cardName: z.string('El nombre de la tarjeta es requerido')
    .min(3, {
        error: 'El nombre de la tarjeta debe tener al menos 3 caracteres'
    })
    .trim(),
    cardNumber: z.string('Numero de tarjeta requerido')
    .min(12, {
        error: 'El numero de tarjeta debe tener al menos 12 digitos'
    })
    .max(19, {
        error: 'El numero de tarjeta no puede exceder 19 digitos'
    })
    .regex(/^\d{12,19}$/, 'Numeor de tarjeta invalido')
    .trim(),
    ccv: z.string('Cvv requerido')
    .min(3, {
        error: 'El cvv debe tener al menos 3 digitos'
    })
    .max(4, {
        error: 'El cvv no puede exceder 4 digitos'
    })
    .regex(/^\d{3,4}$/,'Cvv invalido')
    .trim(),
    expirationDate: z.string('Fecha de expiracion requerida')
    .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Formato de fecha requerida (mm/yy)')
        .trim(),
});

//Esquema para la direccion de envio
const shippingAddressSchema = z.object({
    address: z.string('La direccion es requerida')
    .min(5, {
        error: 'La direccion debe tener al menos 5 caracteres'
    })
    .trim(),
    name: z.string('El nombre es requerido')
    .min(3, {
        error: 'El nombre debe tener al menos 3 caracteres'
    })
    .trim(),
    phone: z.string ('El telefono es requerido')
    .min(7, {
        error:'El telefono debe tener al menos 7 caracteres'
    })
    .max(20, {
        error: 'El telefono no puede exceder 20 caracteres'
    })
    .regex(/^[\d\s\+\-\(\)]{7,20}$/, 'Numero de telefono invalido')
    .trim(),
});

//Esquema para la informacion de pago
const paymentMethodSchema = z.discriminatedUnion('method',
    [
        z.object({
            method: z.literal('card'),
            cardDetails: cardDetailsSchema,
            shippingAddress: shippingAddressSchema,
        }),
        z.object({
            method: z.enum(['pickup']),
            userName: z.string('El nombre es requerido')
            .min(3, {
                error: 'El nombre debe tener al menos 3 caracteres'
            })
            .trim(),
        })
    ]
);

//Esquema principal para la orden de compra
export const orderSchema = z.object({
    items: z.array(cartItemSchema)
    .min(1, 'La orden debe tener al menos un producto'),

    //Metodo de envio para discriminar la union (card o pickup pero no ambos)
    paymentMethod: paymentMethodSchema,

    //Campos para el calculo del total de productos y precio de la orden
    subTotal: z.string()
    .transform((val)=> parseFloat(val))
    .pipe (
        z.number('Subtotal requerido')
        .min(0, {error: 'Subtotal debe ser mayor o igual a 0'})
        .refine((val) => !isNaN(val), {error: 'Subtotal debe ser un numero valido'})
    ),
    iva:z.string()
    .transform( (val) => parseFloat (val))
    .pipe (
        z.number('Iva requerido')
        .min(0,{error:'Iva debe ser mayor o igual a 0'})
        .refine((val) => !isNaN(val), {error: 'Iva debe ser un numero valido'})
    ),
    total: z.string()
    .transform((val) => parseFloat(val))
    .pipe(
        z.number('Total del pedido requerido')
        .min(1, {error:'El total de pedido debe ser mayor a cero'})
        .refine((val)=>!isNaN(val), {error:'Total de pedido debe ser un numero valido'})
    ),
    totalProducts: z.string()
    .transform((val)=> parseFloat(val))
    .pipe(
        z.number()
        .int({error:'Total de productos requerido'})
        .min(0,{error:'La orden debe tener al menos un producto'})
        .refine((val)=>!isNaN(val),{error:'Total de productos debe ser un numero valido'})
    ),

    //Datos para el estado del pedido y fecha y hora de cancelacion 
    status: z.enum(['received','confirmed','cancelled','delivered'])
        .default('received'),
        createdAt: z.date().optional(),
})

.superRefine((data,ctx)=> {
    //Validacion personalizada: subtotal + iva = total
    const calculatedTotal = data.subTotal + data.iva;
    if (Math.abs(calculatedTotal - data.total) > 0.01) {
        ctx.addIssue({
            code:z.ZodCustom,
            message: `El total de calculado (${calculatedTotal}) no coincide con el total proporcionado (${data.total})`,
            path: ['total']
        })
    }

    //Validacion personalizada: totalProducts debe ser igual a la suma de las cantidades
    const calculatedProducts = data.items.reduce( (sum, items)=> sum + items.quantity, 0);
    if (calculatedProducts !== data.totalProducts){
        ctx.addIssue({
            code:z.ZodCustom,
            message: `El total de productos calculado (${calculatedProducts}) no coincide con el valor proporcionado (${data.totalProducts})`,
            path: ['totalProducts']
        });
    }
});//Fin de orderSchema

