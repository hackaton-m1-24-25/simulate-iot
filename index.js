import pkg from 'azure-iot-device';
import { Mqtt } from 'azure-iot-device-mqtt'
import { config } from 'dotenv';
config()

const { Client, Message } = pkg;
const connectionString = process.env.connectionString
const client = Client.fromConnectionString(connectionString, Mqtt);

let isLedOn = false; // État de la LED

async function connectDevice() {
    try {
        await client.open();
        console.log("Lampe connectée à Azure IoT Hub");

        // Récupérer le Device Twin et appliquer l'état initial
        const twin = await client.getTwin();
        if (twin.properties.desired.led !== undefined) {
            isLedOn = twin.properties.desired.led;
            console.log(`État initial de la LED : ${isLedOn ? "on" : "off"}`);
        }

        // Écouter les mises à jour du Device Twin
        twin.on('properties.desired', (update) => {
            console.log("Mise à jour du Device Twin reçue :", update);

            if (update.led !== undefined) {
                isLedOn = update.led;
                console.log(`LED mise à jour : ${isLedOn ? "allumée" : "éteinte"}`);

                // Confirmer la mise à jour en envoyant l'état actuel dans `reported`
                twin.properties.reported.update({ led: isLedOn }, (err) => {
                    if (err) {
                        console.error("Erreur de mise à jour du reported state :", err.toString());
                    } else {
                        console.log("État signalé mis à jour avec succès");
                    }
                });
            }
        });

        // Envoyer l'état de la LED périodiquement
        setInterval(() => {
            const message = new Message(JSON.stringify({ led: isLedOn }));
            console.log(`Envoi de l'état : ${message.getData()}`);

            client.sendEvent(message, (err) => {
                if (err) {
                    console.error("Erreur d'envoi :", err.toString());
                } else {
                    console.log("État envoyé avec succès");
                }
            });
        }, 5000);
    } catch (err) {
        console.error("Erreur de connexion :", err.message);
    }
}

connectDevice();
