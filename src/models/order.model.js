import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        items: [
            {
                productId:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                quantity: Number,
                price: Number
            }
        ],
        subTotal: {
            type:Number,
            required: true
        },
        iva:{
            type:Number,
            required:true
        },
        total: {
            type:Number,
            required:true
        },
        totalProducts: {
            type:Number,
            required: true
        },
        paymentMethod: {
            method: {
                type:String,
                required: true,
                enum:['card', 'pickup','transfer','cash'],
                default: 'card'
            },
            cardDetails: {
                cardName: {
                    type:String,
                    trim: true,
                    required: function () {
                        return this.paymentMethod.method === 'card'
                    }
                },
                cardNumber: {
                    type: String,
                    trim: true,
                    required: function () {
                        return this.paymentMethod.method === 'card'
                    },
                    validate: { 
                        validator: function (v) {
                            return /^\d{12,19}$/.test(v.replace(/\s+/g,''));
                        },
                        message: props=> `${props.value} no es un numero de tarjeta valido`
                    }
                },
                expirationDate: {
                    type: String,
                    trim: true,
                    required: function () {
                        return this.paymentMethod.method === 'card'
                    },
                    validate: {
                        validator: function (v) {
                            return /^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(v);
                        },
                        message: props => `${props.value} no es una fecha de expiracion valida (mm/yy)`
                    }
                        },
                        ccv: {
                            type: String,
                            trim: true,
                            required: function () {
                                return this.paymentMethod.method === 'card';
                            },
                            validate: {
                                validator: function(v){
                                    return /^\d{3,4}$/.test(v);
                                },
                                message: props => `${props.value} no es un CVV valido`
                            }
                        },
            },//Fin de cardDetails
            shippingAddress: {
                address: {
                    type: String,
                    required: true,
                    trim: true,
                    required: function () {
                        return this.paymentMethod.method === 'card'
                    }
                },
                name: {
                    type: String,
                    required: true,
                    trim: true,
                    required: function () {
                        return this.paymentMethod.method === 'card'
                    }
                },
                phone: {
                    type: String,
                    required: true,
                    trim: true,
                    required: function () {
                        return this.paymentMethod.method === 'card'
                    },
                    validate: {
                        validator: function(v) {
                            return /^[\d\s\+\-\(\)]{7,20}$/.test(v);
                        },
                        message: props => `${props.value} no es un numero de telefono valido`
                    }
                },
            }, //Fin de shippingAddress
            userName: {
                type: String,
                trim: true,
                required: function () {
                    return this.paymentMethod.method === 'pickup';
                },
            }, //Fin de userName
        }, //Fin de paymentMethod
        status: {
            type:String,
            enum: ['received','confirmed', 'cancelled', 'delivered'],
            default: 'received'
        },//Fin de status
    },
    {
        timestamps: true
    }
); //Fin de productSchema

export default mongoose.model('Orders', OrderSchema);
