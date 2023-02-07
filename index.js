const express = require('express')
const serverless = require('serverless-http')
const app = express()
app.use(express.json())
const cors = require('cors')
const mysql = require('mysql2')

//2. CORS 설정
//app.use(cors())
app.use(cors({
    'Access-Control-Allow-Origins': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
}));

app.get('/', (req, res) => {
    res.json('test')
});

/* 3. Mysql 설정 */
//Mysql 설정 불러오기
const dbconfig = require('./config/db_config.json')

//Mysql pool 설정 불러오기
const pool = mysql.createPool({
    host: dbconfig.host,
    port: dbconfig.port,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    waitForConnections: true, //사용 가능한 커넥션이 없다면 대기(true), 에러(false)
    connectionLimit: 1,
    queueLimit: 0
})

/* 4. 비동기 처리 */
function dbQueryAsync(sql) {
    return new Promise(function (resolve, reject) {
        pool.getConnection((err, conn) => {
           conn.query(sql, (err, results, fields) => {
                if (err) {
                    conn.release() //DB접속 종료
                    reject(err)
                } else {
                    conn.release() //DB접속 종료
                    resolve(results[0].max_id + 1)
                }
            })
        })
    });
}

app.post('/api/v1/member/count', async (req, res) => {

    const sql = 'SELECT MAX(member_id) max_id FROM member'

    await dbQueryAsync(sql, res).then(function (max_id) {
        console.log("\n node.js msg : Max 값 ", max_id, " 조회 성공 ===============")
        return res.status(200).json({'result':'success', 'msg':max_id})
    }).then().catch(function (err) {
        //console.log("\m node.js error : Max 값 조회 실패 xxxxxxxxxxxxx")
        console.log(err)
        return res.status(400).json({'result':'fail'})
    })
});

//1. express 설정
if(process.env.ENVIRONMENT === 'oneman'){
    module.exports.handler = serverless(app)
} else{
    const port = 3000
    app.listen(port, () => {  //app.listen()은 지정된 port와 host로 접속할 수 있게 bind하고 listen함
        console.log(`OneMan IT News Node.js Listening port : ${port}`)
    })
}


// // DB 커넥션 생성
// const conn = mysql.createConnection({
//     host:dbconfig.host,
//     port:dbconfig.port,
//     user:dbconfig.user,
//     password:dbconfig.password,
//     database:dbconfig.database
// })

// //DB접속
// conn.connect((err) =>{
//     if(err) {
//         console.log("<< Mysql Error >>")
//         console.log(err)
//        // process.exit() //node.js 종료 함수
//     }

//     console.log("Mysql Connected")
// })

// app.post('/api/v1/member/signup', (req, res) => { // function(req, res)
//     const email = req.body.email
//     const password = req.body.password

//     const sql = 'INSERT INTO member (email, password) VALUES (?, ?)'
//     const param = [email, password]

//     conn.query(sql, param, (err, results, fields) =>{
//         if(err){
//             console.log("\n node.js error : 회원가입 실패 ===============")
//             console.log(err)
//             res.status(400).json({'result':'fail', 'msg':'회원가입 실패'})
//         } else {
//             console.log("\n node.js msg : 회원가입 성공 ===============")
//             res.status(200).json({'result':'success', 'msg':'회원가입 성공'})
//         }
//     })

//     conn.end() //DB접속 종료
// })

