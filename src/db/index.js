import mongoose from "mongoose";

const uri = "mongodb+srv://Sajjad:Sajjad0000@cluster0.cuy54vx.mongodb.net/userManagement?retryWrites=true&w=majority&appName=Cluster0"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000 // Increase timeout to 10 seconds
        });
        console.log(`\n MongoDB is connected successfully! DB Host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1);
    }
}

export default connectDB;
