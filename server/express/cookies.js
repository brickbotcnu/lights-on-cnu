export function clearSignedCookie(res, name) {
    res.clearCookie(name, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.HTTPS == 'yes',
        signed: true
    });
}

export function setSignedCookie(res, name, val, age) {
    let options = {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.HTTPS == 'yes',
        signed: true
    }

    if (age) {
        options.maxAge = age;
    }

    res.cookie(name, val, options);
}
