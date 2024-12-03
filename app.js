import express from 'express';
import cors from 'cors';
import {MongoClient, ObjectId} from "mongodb" ;
import bcrypt from 'bcryptjs'
import fs from 'fs';

const client = new MongoClient('mongodb://localhost:27017/');
await client.connect();

const db = client.db("formsArchive");

const app = express();
app.use(cors({
    origin: ['http://localhost:4000','http://127.0.0.1:4000'],
}));

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const Users = db.collection("Users");
const Department = db.collection("Department");
const Model = db.collection("Model");

async function isAuth(key){
    if(key){
        const data = await Users.findOne({ key });

        if (data){
            return true;
        }
    }
}

app.use(express.static('public'));

app.get('/departments', async (req, res) => {
    const departments = await Department.find().toArray();
    res.json(departments);
});

app.get('/forms/:id', async (req, res) => {
    const id = req.params.id;
    if(id){
        const forms = await Model.find({ department_id: id }).toArray();
        res.json(forms);
    }
});

app.get('/download/:id', async (req, res) => {
    if(req.params.id) {
        const fileData = await Model.findOne({ _id: new ObjectId(req.params.id)});

        if(fileData && fileData.file && fileData.fileName && fileData.fileType){
            const file = fs.readFileSync('./file/'+fileData.file, 'utf8');
            
            

            res.json({
                fileName: fileData.fileName,
                file: file
            });
        } else {
            res.end();
        }
    }
});

app.post('/add', async (req, res) => {
    if(!req.headers.auth || !(await isAuth(req.headers.auth))){
        res.end();
        return;
    }

    const {name, file, department, fileName, fileType} = req.body;
    
    if(name && file && department && fileName && fileType){
        const _file = Math.random().toString()+Date.now();

        await new Promise((_done)=>{
            fs.writeFile('./file/'+_file, file, (err) => {
                    if (err) throw err;
                    _done();
                });
            });

        const insert = await Model.insertOne({
            model_name: name, 
            department_id: department,
            file: _file,
            fileName: fileName,
            fileType: fileType
        });
        
            
        res.send('add');

    }
});


app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    if(username && password){

        const home_page = "/";
        const login_page = "/login.html#error";
        
        try {
            const data = await Users.findOne({ username })
            if(data && await bcrypt.compare(password, data.password)){
                const key = await bcrypt.hash(""+Date.now()+"", 10);
                await Users.updateOne({ _id: data._id }, { $set: {key: key} });
            
              res.redirect(home_page+"#key="+key);
            }else{
                throw 0;
            }
        } catch (error) {
            res.redirect(login_page);
        }
    }else{
        res.end();

    }

});


app.post('/register', async (req, res) => {

    const { username, password } = req.body;

    const login_page = "/login.html#register";

    try {
    
    const newUser = { username, password: await bcrypt.hash(password, 10) }; 
    const result = await Users.insertOne(newUser);

        res.redirect(login_page);
    } catch (error) {
    console.error('حدث خطأ أثناء التسجيل:', error);
    res.status(500).send('حدث خطأ أثناء التسجيل');
    }
});


app.post('/search', async (req, res) => {
    const name = req.body.name;
    if(name){
        const forms = await Model.find({ model_name: {
            $regex: name.replaceAll(' ', '.*')
        } }).toArray();
        console.log(forms);

        res.json(forms);
    }
});

app.listen(4000);
