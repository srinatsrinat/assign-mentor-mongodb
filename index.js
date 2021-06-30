var express = require('express')
var app =  express()
var mongodb = require('mongodb')
var mongoClient = mongodb.MongoClient

app.use(express.json())

var dbUrl = "mongodb+srv://tumbuktoo:valentinorossi1@@cluster0.ehete.mongodb.net/<dbName>?retryWrites=true&w=majority"

//api to create mentor records

app.post('/create-mentor', async (req,res)=>{
    
    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var mentor = db.collection('mentor')
    var db_size = await mentor.countDocuments()

    req.body.id_no = db_size + 1
    req.body.students = []

    var updated_collection = await mentor.insertOne(req.body)
    client.close()

    res.status(200).json({
        message: 'mentor record created'
    })

    
})

//api to create student records

app.post('/create-student',async (req,res)=>{

    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var student = db.collection('student')
    var db_size = await student.countDocuments()

    req.body.id_no = db_size + 1
    req.body.mentorAssigned = "nil"
    req.body.mentorID =  ""

    var updated_collection = await student.insertOne(req.body)
    client.close()

    res.status(200).json({
        message: 'student record created'
    })
    
})

//api to show mentor records

app.get('/show-mentor',async (req,res)=>{

    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var mentor = await db.collection('mentor').find().toArray()
    res.json(mentor)
    client.close()
   
})


//api to show student records

app.get('/show-student',async (req,res)=>{

    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var student = await db.collection('student').find().toArray()
    res.json(student)
    client.close()

    
})


//assign, re-assign students to mentors and vice versa, update corresponding student and mentor documents simultaneously

app.put('/assign-student-mentor', async(req,res)=>{

    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var mentor = await db.collection('mentor').find().toArray()
    var student = await db.collection('student').find().toArray()


var stu_id = []

req.body.student_list.map((item)=>{
stu_id.push(parseInt(item.studentID))
})

        if(req.body.student_list.length == 0)                                                                    //to remove all students from a mentor and update student records status of mentor assigned to no mentor or nil or empty, simultaneously
 
        {
            var user = await db.collection('mentor').find({"id_no":req.body.mentorID}).toArray()
            var stu = []
            for(i=0;i<user[0].students.length;i++)
            {
            stu.push(user[0].students[i].studentID)
            }
            var updated_user = await db.collection('student').updateMany({"id_no":{ $in : stu}},{$set: {"mentorAssigned": "nil","mentorID": ""}})
            var del_students = await db.collection('mentor').updateMany({"id_no": req.body.mentorID},{$set :{"students":[]}})  

        }
       else{                                                                                                     //to add new students or reassign students to mentors and update student records about the mentor update, simultaneously
        var deleted_student_entry = await db.collection('mentor').updateMany({},{$pull :{"students":{studentID:{$in: stu_id}}}}) //removes duplicates from existing mentors


        for(i=0;i<req.body.student_list.length;i++){
            var updated_collection = await db.collection('mentor').updateOne({"id_no": req.body.mentorID},{$push:{"students": req.body.student_list[i]}}) //assings one or more students to mentor
            }
        
        
           for(i=0;i<req.body.student_list.length;i++){
            var user = await db.collection('student').findOne({"id_no":req.body.student_list[i].studentID})   //check if student record exists
            if(!user){
               req.body.student_list[i].mentorAssigned = req.body.mentorName
               req.body.student_list[i].mentorID = req.body.mentorID
                var add_student = await db.collection('student').insertOne(req.body.student_list[i])     //if not insert record and assign mentor
      
            }
            else{
                var student_rec_updated = await db.collection('student').updateOne({"id_no": req.body.student_list[i].studentID},
                {$set:{"mentorAssigned":req.body.mentorName, "mentorID":req.body.mentorID}})      // if exists directly assign mentor
            }

           }
       }
    client.close()
    res.status(200).json({
        message: 'record updated'
    })

})


//api that does not show a student who has a mentor or api that shows students without mentor

app.get('/show-student/without-mentor',async (req,res)=>{

    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var students_without_mentor = await db.collection('student').find({"mentorAssigned":"nil"}).toArray()
    client.close()

    if(students_without_mentor.length !=0)
    res.status(200).json(students_without_mentor)                //show students without mentor
    else
    res.json({"message":"All students have mentors"})              //when all students have mentors assigned 

    
})

//api to show all students for a particular mentor

app.get('/show-mentor/all-students', async (req,res)=>{

    var client = await mongoClient.connect(dbUrl)
    var db = client.db('student_mentor')
    var students_of_a_mentor = await db.collection('mentor').find({"id_no":req.body.mentorID}).toArray()   
    client.close()
console.log(students_of_a_mentor)
    if(students_of_a_mentor.length == 0)
    { res.json({"message": "No mentor for the ID"})}    //when no mentor exists
    else
    { 
        var to_send = []
        to_send.push({"Mentor_Name":students_of_a_mentor[0].mentor_name, "Mentor_ID":students_of_a_mentor[0].id_no},{"Students":students_of_a_mentor[0].students})  //for a given mentor
        res.json(to_send) 
    }
       


    
    
})



app.listen(process.env.PORT || 3000)




