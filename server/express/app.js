import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import express from 'express';
import helmet from 'helmet';
import { DateTime, Duration } from 'luxon';
import { uptime } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { clearSignedCookie, setSignedCookie } from '#root/express/cookies.js';
import { getLightingRelays, getOutletRelays, getRelayConfiguration } from '#root/express/relayConfiguration.js';
import { fieldHasValidationErrors, passFieldValidation, userFieldValidation } from '#root/express/validationChains.js';

import { ARDUINO_OPTA_COUNT, RELAY_COUNT } from '#root/const.js';
import dbPool from '#root/databasePool.js';

// workaround to get __dirname equivalent in ES module
const DIRNAME = dirname(fileURLToPath(import.meta.url));

// bcrypt password hash round
const BCRYPT_PASS_HASH_ROUNDS = 10;

// default session age & remember me session age
const SESSION_AGE_DEFAULT  = Duration.fromObject({ hours: 8 });
const SESSION_AGE_REMEMBER = Duration.fromObject({ days: 14 });

// relay configuration, editable by user
let relayConfiguration = await getRelayConfiguration();

// require no session or invalid (expired) session
function requireNoSession(req, res, next) {
    if (!req.session.exists) {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

// require valid session
function requireValidSession(req, res, next) {
    if (req.session.exists) {
        next();
    } else {
        res.redirect('/login');
    }
}

// require admin role
function requireAdminRole(req, res, next) {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

const USE_HTTPS = process.env.HTTPS_ENABLED == 'yes';
const app = express();

// use EJS
app.set('view engine', 'ejs');
app.set('views', join(DIRNAME, './views'));

// force HTTPS connections
app.use((req, res, next) => {
    if (USE_HTTPS && !req.secure) {
        res.redirect('https://' + req.headers.host + req.url); 
    } else {
        next();
    }
});

// CSP nonce for inline scripts
app.use((req, res, next) => {
    res.locals.cspNonce = randomBytes(32).toString('hex');
    next();
});

// use helmet if HTTPS is enabled
if (USE_HTTPS) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`]
            }
        },
        strictTransportSecurity: false
    }));
}

// parse urlencoded body
app.use(express.urlencoded({ extended: false }));

// parse request cookies
app.use(cookieParser(process.env.COOKIE_SECRET));

// serve static files (.css, .js)
app.use('/static', express.static(join(DIRNAME, './static')));

// check for existing session
app.use(async (req, res, next) => {
    req.session = {};

    // if sessionId cookie doesn't exist
    const sessionId = req.signedCookies.sessionId;
    if (typeof sessionId === 'undefined' || sessionId === null) {
        req.session.exists = false;
        return next();
    }

    // check if session exists in db
    const dbConn = await dbPool.getConnection();
    const searchSessionQuery = 'SELECT `user`, `expire` FROM `sessions` WHERE `sessionId` = ?';
    const searchSessionResult = await dbConn.query(searchSessionQuery, req.signedCookies.sessionId);

    if (dbConn) dbConn.release();

    // if session exists, copy session data and user role in req.session object
    if (searchSessionResult.length == 1) {
        const session = searchSessionResult[0];

        const getUserRoleQuery = 'SELECT `role` FROM `users` WHERE `user` = ?';
        const getUserRoleResult = await dbConn.query(getUserRoleQuery, session.user);

        req.session.exists = true;
        req.session.role = getUserRoleResult[0].role;
        Object.assign(req.session, session);

        return next();
    // if session doesn't exist, clear sessionId cookie and redirect user to login page
    } else {
        // expired session
        clearSignedCookie(res, 'sessionId');
        res.redirect('/login');
    }
});

// options required by page header
function getEjsHeaderOpts(req) {
    return {
        sessionUser: req.session.user,
        sessionExpireHours: Math.floor(DateTime.fromJSDate(req.session.expire).diff(DateTime.now()).as('hours')),
        isAdmin: req.session.role === 'admin'
    }
}

// SESSION ROUTES

// GET /dashboard
app.get('/dashboard', requireValidSession, (req, res) => {
    const lastBootDate = new Date(Date.now() - Math.floor(uptime() * 1000)).toLocaleString('ro-RO');
    res.render('dashboard', {...getEjsHeaderOpts(req), ...{
        lightingRelays: getLightingRelays(relayConfiguration),
        outletRelays: getOutletRelays(relayConfiguration),
        arduinoCount: ARDUINO_OPTA_COUNT,
        lastBootDate: lastBootDate,
        cspNonce: res.locals.cspNonce
    }});
});

// GET /configuration
// POST /configuration
app.get('/configuration', requireValidSession, requireAdminRole, (req, res) => {
    res.render('configuration', {...getEjsHeaderOpts(req), ...{
        relayConfiguration: relayConfiguration
    }});
});

app.post('/configuration', requireValidSession, requireAdminRole, async (req, res) => {
    const dbConn = await dbPool.getConnection();

    const relayNames = Array(RELAY_COUNT);
    const relayCategories = Array(RELAY_COUNT);
    for (let id = 0; id < RELAY_COUNT; id++) {
        relayNames[id] = req.body['name-' + id];
        if (!relayNames[id]) {
            relayNames[id] = null;
        } else {
            relayNames[id] = relayNames[id].toUpperCase();
        }

        relayCategories[id] = req.body['category-' + id];
        if (!relayCategories[id] || (relayCategories[id] != 'LIGHTING' && relayCategories[id] != 'OUTLET')) {
            relayCategories[id] = null;
        }

        const deleteRelayQuery = 'DELETE FROM `relays` WHERE `relayId` = ?';
        await dbConn.query(deleteRelayQuery, id);

        if (relayNames[id] && relayCategories[id]) {
            const insertRelayQuery = 'INSERT INTO `relays` (`relayId`, `name`, `category`) VALUES (?, ?, ?)';
            await dbConn.query(insertRelayQuery, [id, relayNames[id], relayCategories[id]]);
        }
    }

    if (dbConn) dbConn.release();

    relayConfiguration = await getRelayConfiguration();

    res.redirect('/configuration');
});

// GET /user-management
// POST /user-deny
// POST /user-accept
app.get('/user-management', requireValidSession, requireAdminRole, async (req, res) => {
    const dbConn = await dbPool.getConnection();
    const signupRequestsQuery = 'SELECT `user`, `requestDate` FROM `signup_requests`';
    const signupRequests = await dbConn.query(signupRequestsQuery);
    if (dbConn) dbConn.release();

    signupRequests.forEach(signupReq => {
        signupReq.requestDate = DateTime.fromJSDate(signupReq.requestDate).toFormat('yyyy-MM-dd HH:mm:ss');
    });

    res.render('user-management', {...getEjsHeaderOpts(req), ... {
        signupRequests: signupRequests
    }});
});

app.post('/user-deny', requireValidSession, requireAdminRole, async (req, res) => {
    const dbConn = await dbPool.getConnection();
    const deleteUserQuery = 'DELETE FROM `signup_requests` WHERE `user` = ?';
    await dbConn.query(deleteUserQuery, req.body.user);
    if (dbConn) dbConn.release();

    res.redirect('/user-management');
});

app.post('/user-accept', requireValidSession, requireAdminRole, async (req, res) => {
    const dbConn = await dbPool.getConnection();

    const selectUserQuery = 'SELECT `user`, `passHash` FROM `signup_requests` WHERE `user` = ?';
    const selectUserResult = await dbConn.query(selectUserQuery, req.body.user);

    const deleteUserQuery = 'DELETE FROM `signup_requests` WHERE `user` = ?';
    await dbConn.query(deleteUserQuery, req.body.user);

    if (selectUserResult.length == 1) {
        const acceptedUser = selectUserResult[0];
        const insertAcceptedUserQuery = 'INSERT INTO `users` (`user`, `passHash`) VALUES (?, ?)';
        await dbConn.query(insertAcceptedUserQuery, [acceptedUser.user, acceptedUser.passHash]);
    }

    if (dbConn) dbConn.release();
    
    res.redirect('/user-management');
});

// GET /change-username
// POST /change-username
app.get('/change-username', requireValidSession, (req, res) => {
    const changeUsernameResult = req.signedCookies.changeUsernameResult;
    clearSignedCookie(res, 'changeUsernameResult');
    res.render('change-username', {...getEjsHeaderOpts(req), ... {
        changeUsernameResult: changeUsernameResult
    }});
});

app.post('/change-username', requireValidSession, userFieldValidation('newUser'), passFieldValidation('pass'), async (req, res) => {
    let dbConn;

    let changeUsernameResult = 'success';

    if (req.session.user != req.body.oldUser) {
        changeUsernameResult = 'oldUsernameIncorrect';
    } else if (req.body.oldUser == req.body.newUser) {
        changeUsernameResult = 'newUsernameNotDifferent';
    } else if (fieldHasValidationErrors(req, 'newUser')) {
        changeUsernameResult = 'newUsernameInvalid';
    } else if (fieldHasValidationErrors(req, 'pass')) {
        changeUsernameResult = 'passError';
    } else {
        dbConn = await dbPool.getConnection();

        // check if new username is already in use
        const searchExistingUserQuery = 'SELECT `user` FROM `users` WHERE `user` = ?';
        const searchExistingUserResult = await dbConn.query(searchExistingUserQuery, req.body.newUser);

        // or if there is a signup request with that username
        const searchExistingSignupReqQuery = 'SELECT `user` FROM `signup_requests` WHERE `user` = ?';
        const searchExistingSignupReqResult = await dbConn.query(searchExistingSignupReqQuery, req.body.newUser);

        if (searchExistingUserResult.length > 0 || searchExistingSignupReqResult.length > 0) {
            changeUsernameResult = 'newUsernameInUse';
        } else {
            // verify password
            const getUserPassHashQuery = 'SELECT `passHash` FROM `users` WHERE `user` = ?';
            const getUserPassHashResult = await dbConn.query(getUserPassHashQuery, req.session.user);
            const passHash = getUserPassHashResult[0].passHash;
            const passMatch = await bcrypt.compare(req.body.pass, passHash);

            if (!passMatch) {
                changeUsernameResult = 'passError';
            } else {
                // update username
                const updateUsernameQuery = 'UPDATE `users` SET `user` = ? WHERE `user` = ?';
                await dbConn.query(updateUsernameQuery, [req.body.newUser, req.body.oldUser]);

                // invalidate all user sessions
                const deleteAllSessionsQuery = 'DELETE FROM `sessions` WHERE `user` = ?';
                await dbConn.query(deleteAllSessionsQuery, req.body.oldUser);
            }
        }
    }

    if (dbConn) dbConn.release();

    setSignedCookie(res, 'changeUsernameResult', changeUsernameResult);

    if (changeUsernameResult == 'success') {
        clearSignedCookie(res, 'sessionId');
        res.redirect('/login');
    } else {
        res.redirect('/change-username');
    }
});

app.get('/change-password', requireValidSession, async (req, res) => {
    const changePasswordResult = req.signedCookies.changePasswordResult;
    clearSignedCookie(res, 'changePasswordResult');
    res.render('change-password', {...getEjsHeaderOpts(req), ...{
        changePasswordResult: changePasswordResult
    }});
});

app.post('/change-password', requireValidSession, passFieldValidation('oldPass'), passFieldValidation('newPass'), async (req, res) => {
    let changePasswordResult = 'success';

    if (fieldHasValidationErrors(req, 'oldPass')) {
        changePasswordResult = 'oldPassIncorrect';
    } else if (fieldHasValidationErrors(req, 'newPass')) {
        changePasswordResult = 'newPassError';
    } else if (req.body.newPass != req.body.confirmPass) {
        changePasswordResult = 'passNotMatching';
    } else {
        const dbConn = await dbPool.getConnection();
        const getOldPassHashQuery = 'SELECT `passHash` FROM `users` WHERE `user` = ?';
        const getOldPassHashResult = await dbConn.query(getOldPassHashQuery, req.session.user);
        const oldPassHash = getOldPassHashResult[0].passHash;
        const oldPassMatch = await bcrypt.compare(req.body.oldPass, oldPassHash);
    
        if (!oldPassMatch) {
            changePasswordResult = 'oldPassIncorrect';
        } else {
            bcrypt.hash(req.body.newPass, BCRYPT_PASS_HASH_ROUNDS, async (err, newPassHash) => {
                if (!err) {
                    const updatePassQuery = 'UPDATE `users` SET `passHash` = ? WHERE `user` = ?';
                    await dbConn.query(updatePassQuery, [newPassHash, req.session.user]);

                    const deleteAllSessionsQuery = 'DELETE FROM `sessions` WHERE `user` = ?';
                    await dbConn.query(deleteAllSessionsQuery, req.session.user);
                }
            });
        }

        if (dbConn) dbConn.release();
    }

    setSignedCookie(res, 'changePasswordResult', changePasswordResult);

    if (changePasswordResult == 'success') {
        clearSignedCookie(res, 'sessionId');
        res.redirect('/login');
    } else {
        res.redirect('/change-password');
    }
});

// POST /revoke-sessions
// POST /logout
app.post('/revoke-sessions', requireValidSession, async (req, res) => {
    const dbConn = await dbPool.getConnection();
    const deleteAllSessionsQuery = 'DELETE FROM `sessions` WHERE `user` = ?';
    await dbConn.query(deleteAllSessionsQuery, req.session.user);
    if (dbConn) dbConn.release();

    clearSignedCookie(res, 'sessionId');
    res.redirect('/login');
});

app.post('/logout', requireValidSession, async (req, res) => {
    const dbConn = await dbPool.getConnection();
    const deleteSessionQuery = 'DELETE FROM `sessions` WHERE `sessionId` = ?';
    await dbConn.query(deleteSessionQuery, req.signedCookies.sessionId);
    if (dbConn) dbConn.release();

    clearSignedCookie(res, 'sessionId');
    res.redirect('/login');
});

// NO SESSION ROUTES

// GET /login
// POST /login
app.get('/login', requireNoSession, (req, res) => {
    const loginActionResult = req.signedCookies.loginActionResult;
    clearSignedCookie(res, 'loginActionResult');
    res.render('login', { infoText: loginActionResult || 'default' });
});

app.post('/login', userFieldValidation('user'), passFieldValidation('pass'), requireNoSession, async (req, res) => {
    let loginActionResult = 'success';

    if (fieldHasValidationErrors(req, 'user') || fieldHasValidationErrors(req, 'pass')) {
        loginActionResult = 'credentialsError';
    } else {
        const dbConn = await dbPool.getConnection();
        const searchUserQuery = 'SELECT `passHash` FROM `users` WHERE `user` = ?';
        const searchUserResult = await dbConn.query(searchUserQuery, req.body.user);

        if (searchUserResult.length == 1) {
            const passHash = searchUserResult[0].passHash;
            const passMatch = await bcrypt.compare(req.body.pass, passHash);

            if (passMatch) {
                const rememberUser = req.body.remember == 'on';
                const sessionAge = rememberUser ? SESSION_AGE_REMEMBER : SESSION_AGE_DEFAULT;
                const sessionExpire = DateTime.now().plus(sessionAge).toFormat('yyyy-MM-dd HH:mm:ss');

                const sessionId = uuidv4();
                const createSessionQuery = 'INSERT INTO `sessions` (`sessionId`, `user`, `expire`) VALUES (?, ?, ?)';
                await dbConn.query(createSessionQuery, [sessionId, req.body.user, sessionExpire]);

                setSignedCookie(res, 'sessionId', sessionId, sessionAge.toMillis());
            } else {
                loginActionResult = 'credentialsError';
            }
        } else {
            loginActionResult = 'credentialsError';
        }

        if (dbConn) dbConn.release();
    }

    setSignedCookie(res, 'loginActionResult', loginActionResult);
    if (loginActionResult == 'success') {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// GET /signup
// POST /signup
app.get('/signup', requireNoSession, (req, res) => {
    const signupActionResult = req.signedCookies.signupActionResult;
    clearSignedCookie(res, 'signupActionResult');
    res.render('signup', { infoText: signupActionResult || 'default' });
});

app.post('/signup', userFieldValidation('user'), passFieldValidation('pass'), requireNoSession, async (req, res) => {
    let signupActionResult = 'success';

    if (fieldHasValidationErrors(req, 'user')) {
        signupActionResult = 'userFieldError';
    } else if (fieldHasValidationErrors(req, 'pass')) {
        signupActionResult = 'passFieldError';
    } else {
        const dbConn = await dbPool.getConnection();
        const searchExistingUserQuery = 'SELECT `user` FROM `users` WHERE `user` = ?';
        const searchExistingUserResult = await dbConn.query(searchExistingUserQuery, req.body.user);

        const searchExistingSignupReqQuery = 'SELECT `user` FROM `signup_requests` WHERE `user` = ?';
        const searchExistingSignupReqResult = await dbConn.query(searchExistingSignupReqQuery, req.body.user);

        if (searchExistingUserResult.length > 0 || searchExistingSignupReqResult.length > 0) {
            signupActionResult = 'userExistsError';
        } else {
            bcrypt.hash(req.body.pass, BCRYPT_PASS_HASH_ROUNDS, async (err, passHash) => {
                if (!err) {
                    const userSignupQuery = 'INSERT INTO `signup_requests` (`user`, `passHash`) VALUES (?, ?)';
                    await dbConn.query(userSignupQuery, [req.body.user, passHash]);
                }
            });
        }

        if (dbConn) dbConn.release();
    }

    setSignedCookie(res, 'signupActionResult', signupActionResult);
    res.redirect('/signup');
});

// catch unmatched requests
app.all('*', (req, res) => {
    res.redirect('/login');
});

export default app;
