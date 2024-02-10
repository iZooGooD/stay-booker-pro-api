import User from '../models/User.model.js';
import {
    validateEmail,
    validatePhoneNumber,
    UserExists,
} from '../utils/validators.js';
import {
    generateNewToken,
    getToken,
    validateToken,
} from '../utils/auth-helpers.js';

const validateUserInput = async ({
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
}) => {
    const errorsList = [];

    // Validate firstName
    if (!firstName) errorsList.push('first name is required');
    else if (firstName.length < 3)
        errorsList.push('The first name must be at least 4 characters long.');
    else if (firstName.length > 64)
        errorsList.push('The first name must not exceed 64 characters.');

    // Validate lastName
    if (!lastName) errorsList.push('last name is required');
    else if (lastName.length < 3)
        errorsList.push('The last name must be at least 4 characters long.');
    else if (lastName.length > 64)
        errorsList.push('The last name must not exceed 64 characters.');

    // Validate email
    if (!email) errorsList.push('Email address is required');
    else if (!validateEmail(email))
        errorsList.push('The email address format is invalid.');
    else if (await UserExists(email)) errorsList.push('This Email is taken');

    // Validate password
    if (!password) errorsList.push('Password is required.');
    else if (
        !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$@#&!]).{8,}$/.test(password)
    )
        errorsList.push(
            'Password must be at least 8 characters long and include a number, an uppercase letter, a lowercase letter, and a special character ($, @, #, &, or !).'
        );

    // Validate phone number
    if (!phoneNumber) errorsList.push('Phone number is required.');
    else if (!validatePhoneNumber(phoneNumber))
        errorsList.push('The phone number format is invalid.');

    return errorsList;
};

export const registerUser = async (req, res) => {
    try {
        const errorsList = await validateUserInput(req.query);

        if (errorsList.length === 0) {
            await User.create({
                firstName: req.query.firstName,
                lastName: req.query.firstName,
                email: req.query.email,
                password: req.query.password,
                phoneNumber: req.query.phoneNumber,
                profilePicture: '',
            });
            return res.status(201).json({
                errors: [],
                data: {
                    status: 'User created successfully',
                },
            });
        } else {
            return res.status(400).json({
                errors: errorsList,
                data: {
                    status: 'User not created',
                },
            });
        }
    } catch (error) {
        return res.status(500).json({
            errors: ['A technical error has occurred'],
            data: {
                status: 'User not created',
            },
        });
    }
};

/**
 * Handles user login, including token generation and validation.
 *
 * @param {Object} req - The request object containing login credentials.
 * @param {Object} res - The response object used to send back the HTTP response.
 * @returns {Promise} A promise that resolves to the HTTP response with either a token or an error message.
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // TODO, use bcrypt to compare passwords
        const user = await User.findOne({
            where: {
                email,
                password,
            },
        });

        if (user) {
            // Check for existing token in the authorization header
            const existingToken = getToken(req.headers.authorization);
            const isTokenValid = validateToken(existingToken);

            if (existingToken && isTokenValid) {
                // If an existing token is valid, return it
                return res.status(200).json({ token: existingToken });
            } else {
                // Generate a new token for the user - possibly the token is expired.
                const token = generateNewToken(user);
                return res.status(200).json({ token });
            }
        } else {
            return res
                .status(404)
                .json({ message: 'User not found or invalid credentials' });
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        return res.status(500).json({
            message: 'An error occurred during the login process',
        });
    }
};

export const userDetails = async (req, res) => {
    try {
        return res.status(200).json({
            status: 'Welcome',
        });
    } catch (error) {
        return res.status(500).json({
            errors: ['A technical error has occurred'],
            data: {
                status: 'Could not verify token',
            },
        });
    }
};
