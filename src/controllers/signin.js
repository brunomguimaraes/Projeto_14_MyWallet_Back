import bcrypt from 'bcrypt';
import connection from '../database/database.js';
import { signInSchema } from '../schemas/schemas.js'
import { v4 as uuid } from 'uuid';

export default async function postSignIn(req, res) {
    const {
        email,
        password
    } = req.body;

    const { error } = signInSchema.validate(req.body);

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    try {
        const emailCheck = await connection.query('SELECT * from users WHERE email = $1', [email]);
        if (emailCheck.rowCount === 0) {
            return res.status(401).send('Invalid e-mail');
        }

        const passwordCheck = bcrypt.compareSync(password, emailCheck.rows[0].password);
        if (!passwordCheck) {
            return res.status(401).send('Invalid password');
        }

        const token = uuid();

        await connection.query(`
        INSERT INTO sessions
            (user_id, token)
        VALUES
            ($1, $2)
        `, [emailCheck.rows[0].id, token]);

        res.send({ token })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}
