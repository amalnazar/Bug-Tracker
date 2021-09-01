
const express = require('express');
const mysql = require('mysql');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

const chance = require('chance').Chance();

const publicDir =path.join(__dirname,'/public/Images');
app.use(express.static(publicDir));

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'bugtracker'
})
connection.connect((err) => {
    if(err) throw err
    else{
        console.log('Database Connection Established');
    }
});



app.set('view engine','ejs')

app.get('/',(req,res) => {
   
    res.render('login')

    
})
var block = false;
var BlockingMiddleware = function(req, res, next) {
  if (block === true)
    return res.sendStatus(503); // 'Service Unavailable'
  next();
};
app.post('/',(req,res) => {
    const{username,password} = req.body
    
    connection.query('SELECT * FROM users WHERE username=? and password=?',[username,password],(err,rows) =>{
        if (rows.length>0 && rows[0].role == 'admin') {
            res.redirect('/home')          
        }
        else if (rows.length > 0 ){
            
            res.redirect('/addbug')
        }
        else{
            res.send(`<h1>Invalid Credentials</h1>`)
        }
    })
})

app.get('/home',BlockingMiddleware,(req,res) => {
    res.render('home')
})

app.get('/addbug',(req,res) => {
    res.render('addbug')
})
app.post('/addbug',(req,res) => {
    const date = new Date()
    const id = chance.integer({min:1})
    console.log(id)
    const {bugtitle,username,severity,status} =req.body
    console.log(req.body)
    
    connection.query('INSERT INTO bug_details SET id=?,bugtitle=?,username=?,severity=?,status=?,opendate=?',[id,bugtitle,username,severity,status,date],(err,rows)=>{
        if(err) throw err
        else{
            res.render('addbug',{bugs:rows});
            
        }
    })
})
app.get('/reports',(req,res) => {
    connection.query('SELECT * FROM bug_details ORDER BY status DESC',(err,rows) => {
        if(err) throw err
        else{
            res.render('reports',{bugs:rows})
        }
    }) 
})
app.post('/reports',(req,res) => {
    
    let searchTerms = req.body.search
    
    connection.query('SELECT * FROM bug_details WHERE username LIKE ?',['%' + searchTerms + '%'],(err,rows) => {
        
        if(err) throw err
        else{
            res.render('reports',{bugs:rows})
        }
    })
})










app.get('/update/:id',(req,res) => {
    console.log(req.params.id)
    connection.query('SELECT * FROM bug_details WHERE id='+req.params.id,(err,rows) => {
        console.log(rows)
        if(rows[0].status=='Closed'){
            res.send(`<h3>Issue Already Closed ....Issue Once Closed Cannot Be Updated...Please Contact Your System Admin`)
        }
        else{
            res.render('update',{bugs:rows})
        }
    })
    
})
app.post('/update/save',(req,res) => {
    const close_date = new Date()
    const{bugtitle,username,severity,status,issuecloser} = req.body
    connection.query('UPDATE bug_details SET bugtitle=?,username=?,severity=?,status=?,issue_close_date=?,issue_closed_by=? WHERE id=?',[bugtitle,username,severity,status,close_date,issuecloser,req.body.id],(err,rows) => {
        if(err) throw err
        else{
            res.redirect('/reports')
        }
    })
})
app.get('/delete/:id',(req,res) => {
    connection.query('DELETE FROM bug_details WHERE id='+req.params.id,(err,rows) => {
        if(err) throw err
        else{
            res.redirect('/reports')
        }
    })
})



app.listen(5000,() => {
    console.log('Server is listening on port 5000...');
})