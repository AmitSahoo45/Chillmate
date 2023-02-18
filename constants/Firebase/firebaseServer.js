import admin from 'firebase-admin';

const firebaseServer = () => {
    if(!admin.app.length){
        const serviceAccount = {
            type: process.env.type,
            projectId: process.env.NEXT_PUBLIC_projectId,
            privateKeyId: process.env.NEXT_PUBLIC_private_key_id,
            privateKey: process.env.NEXT_PUBLIC_privateKey,
            clientEmail: process.env.NEXT_PUBLIC_client_email,
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_databaseURL
        })
    }
}

export default firebaseServer;