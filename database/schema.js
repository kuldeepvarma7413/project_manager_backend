const mongoose = require('mongoose');

// organisation table
const organisationSchema = new mongoose.Schema({
    name: String,
});
// employees table (name, email, phone, organisation_id, photo)
const employeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    organisation_id: String,
    photo: String,
    designation: String,
    department: String,
    address: String
});
// task containers table (container_id, organisation_id reference to organisation table)
const taskContainerSchema = new mongoose.Schema({
    container_id: String,
    organisation_id: String
});
// tas table (task_id, title, description, phase, assigned_to, deadline, progress, container_id reference to task containers table)
const taskSchema = new mongoose.Schema({
    task_id: String,
    title: String,
    description: String,
    phase: String,
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employeeSchema'
    },
    deadline: String,
    progress: String,
    container_id: String
});

// construct models
const Organisation = mongoose.model('Organisation', organisationSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const TaskContainer = mongoose.model('TaskContainer', taskContainerSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = {
    TaskContainer,
    Organisation,
    Employee,
    Task
}