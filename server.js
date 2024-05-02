const express = require('express');
const mongoose = require('mongoose');
const schema = require('./database/schema');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Create an Express app
const app = express();

// middleware
app.use(express.json());    // return data in json
app.use(express.urlencoded({extended: true}))   // parse url and return object in body
app.use((req, res, next)=>{
    console.log(req.url);
    next();
})

// cors
const cors = require('cors')
app.use(cors())

// Increase the limit for JSON payloads
app.use(express.json({ limit: '10mb' })); // Adjust the limit as needed

// Increase the limit for URL-encoded payloads
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Adjust the limit as needed


// multer to access files in formData
// Define storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Save files to 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // Keep the original filename
    }
});

// Create upload instance with multer
const upload = multer({ storage: storage });



// Connect to MongoDB
async function connectDB(){
    try {
        await mongoose.connect('mongodb+srv://kuldeepvarma7413:ProjectManager7413@projectmanagerproject.yyc9pke.mongodb.net/', {})
        console.log('Connected to the database.');
    }catch (e) {
        console.log('Error connecting to the database.');
        throw e
    }    
};

// connect to cloudinary
cloudinary.config({
    cloud_name: 'dylmvpvn7',
    api_key: '913441945363269',
    api_secret: '-bhQOD7EDDRaxLR3Kxq_xnN5LM4',
    secure: true
});



// working fine
// routes
app.get('/', (req, res) => {
    res.send('Project Manager Backend Server');
});    

// working fine
// route to add employee in database (getting name, email, designation, department, phone, address, organisation_id, photo in request body)
app.post('/add-employee', upload.single('photo'), async (req, res) => {
    try{
        console.log(req.body)
        if(req.body.photo){
            
            // Upload photo to Cloudinary
            const base64Image = req.body.photo;
            // Remove the header from the base64 string
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            // Create a buffer from the base64 data
            
            if(!base64Data){
                console.log("file not found")
                return res.status(400).send('No file uploaded.');
            }
            // upload on cloudinary
            
            const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Data}`, { folder: 'project_manager/profile_photos' });            
            // Save the image URL in the photo tag of schema
            const employee = new schema.Employee({
                name: req.body.name,
                email: req.body.email,
                designation: req.body.designation,
                department: req.body.department,
                phone: req.body.phone,
                address: req.body.address,
                organisation_id: req.body.organisation_id,
                photo: uploadResult.secure_url
            });    
        
            await employee.save();
            res.send('Employee added to the database');
        }else{
            res.status(402).send('Photo not found');
        }
    }catch(error){
        console.error('Error adding employee:', error);
        res.status(500).send('Internal Server Error');
    }
});

// working fine
// route to get all employees of an organisation (getting organisation_id in request body)
app.get('/get-employees', async (req, res) => {
    const employees = await schema.Employee.find({ organisation_id: req.query.organizationId });
    res.send(employees);
});

// working fine
// route to delete employee (getting employee id in request body)
app.delete('/delete-employee', async (req, res) => {
    const employeeId = req.query.id;

    // Delete employee image from Cloudinary
    const employee = await schema.Employee.findById(employeeId);
    const imagePublicId = employee.photo.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(imagePublicId);

    // Delete employee from MongoDB
    await schema.Employee.findByIdAndDelete(employeeId);

    res.send('Employee deleted from the database');
});

// working fine
// update employee (getting employee id in request query)
app.put('/update-employee', async (req, res) => {
    try{
        // if photo is in request
        const employee = await schema.Employee.findById(req.query.id);
        if(req.body.photo){
            // Upload photo to Cloudinary
            const base64Image = req.body.photo;
            
            // Upload image directly from base64 data
            const uploadResult = await cloudinary.uploader.upload(base64Image, { folder: 'project_manager/profile_photos' });
            employee.photo = uploadResult.secure_url;
        }
        employee.name = req.body.name;
        employee.email = req.body.email;
        employee.designation = req.body.designation;
        employee.department = req.body.department;
        employee.phone = req.body.phone;
        employee.address = req.body.address;
        await employee.save();
        res.send('Employee updated');
    }catch(error){
        console.error('Error updating employee:', error);
        res.status(500).send('Internal Server Error');
    }
});

// working fine
// returns all employees id and name depending on organisation id (in query)
app.get('/get-employees', async (req, res) => {
    const employees = await schema.Employee.find({ organisation_id: req.query.organizationId }).select('name _id');
    res.send(employees);
});


// working fine
// route to add task in database (getting title, description, phase, assigned_to, deadline, progress, container_id in request body)
app.post('/add-task', async (req, res) => {
    const task = new schema.Task({
        title: req.body.title,
        description: req.body.description,
        phase: req.body.phase,
        assigned_to: req.body.assigned_to,
        deadline: req.body.deadline,
        progress: req.body.progress,
        organisation_id: req.body.organisation_id,
        container_id: req.body.container_id
    });
    try {
        var retTask= await task.save();
        retTask = JSON.parse(JSON.stringify(retTask));
        // fetch employee name and image only using assigned_to
        const employee = await schema.Employee.findOne({ _id: task.assigned_to });
        retTask.employee_info = {
            "name":employee.name,
            "photo":employee.photo
        };
        res.json(retTask);
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).send('Internal Server Error');
    }
});

// working fine
// route to get all tasks of an organisation (getting organisation_id in request body)
app.get('/get-tasks', async (req, res) => {
    // const tasks = await schema.Task.find({ organisation_id: req.body.organisation_id });
    // return all tasks (for each task, using assigned to, find employee name and photo), use mongodb joins
    const tasks = await schema.Task.aggregate([
        {
            $lookup: {
                from: 'employees', // name of the other collection
                localField: 'assigned_to', // name of the employee id field in the Task collection
                foreignField: '_id', // name of the employee id field in the Employee collection. Change this if your id field has a different name
                as: 'employee_info' // output field with the joined employee info
            }
        },
        {
            $match: { organisation_id: req.body.organisation_id }
        },
        {
            $unwind: '$employee_info' // Unwind the employee_info array to convert it into an object
        },
        {
            $project: {
                task_id: 1,
                title: 1,
                description: 1,
                phase: 1,
                assigned_to: 1,
                deadline: 1,
                progress: 1,
                container_id: 1,
                'employee_info.name': 1,
                'employee_info.photo': 1
            }
        }
    ]);
    
    res.send(tasks);
});

// checking
// route to change container id of a task (getting task_id, container_id, organisation_id in request body)
app.put('/change-container', async (req, res) => {
    const { taskId, containerId } = req.query;
    try {
        const updatedTask = await schema.Task.findOneAndUpdate(
            { _id: taskId }, // Find the task by taskId
            { container_id: containerId }, // Update the container_id with the new value
            { new: true } // Return the updated document
        );

        if (updatedTask) {
            console.log("Updated task:", updatedTask);
            res.send('Task containerId updated');
        } else {
            console.log("Task not found with taskId:", taskId);
            res.status(404).send('Task not found');
        }
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json("Internal Server Error");
    }
});

// route to update whole task (getting task_id in request body)
app.put('/update-task', async (req, res) => {
    const { _id, title, description, phase, assigned_to, deadline, progress } = req.body;

    console.log(req.body)

    try {
        const updatedTask = await schema.Task.findOneAndUpdate(
            { _id: _id },
            { 
                title: title,
                description: description,
                phase: phase,
                assigned_to: assigned_to,
                deadline: deadline,
                progress: progress
            },
            { new: true } // to return the updated document
        );

        console.log("Updated task:", updatedTask);
        res.json('Task updated');
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json("Internal Server Error");
    }
});


// implement in end
// route to add organisation in database (getting organisation name in request or route)
app.post('/addOrganisation', async (req, res) => {
    const orgName = req.body.name;
    const organisation = new schema.Organisation({ name: orgName });
    await organisation.save();

    // Create 5 containers for the organisation
    for (let i = 1; i <= 5; i++) {
        const container = new schema.TaskContainer({
            name: `Container ${i}`,
            organisation_id: organisation._id
        });
        await container.save();
    }

    res.send('Organisation added to the database');
});





// Server listening
async function startServer() {
    await connectDB();
    app.listen(7413, () => {
        console.log('Server started on port 7413\nhttp://localhost:7413/');
    });
}

startServer();




