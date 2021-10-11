const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
              return User.findOne({ _id: context.user._id });
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);

            return { token, user };
        },

        login: async (parent, { loginEmail, password }) => {
            const user = await User.findOne({ email: loginEmail });

            if (!user) {
                throw new AuthenticationError('No user with this email found!');
              }
        
              const correctPw = await user.isCorrectPassword(password);
        
              if (!correctPw) {
                throw new AuthenticationError('Incorrect password!');
              }
        
              const token = signToken(user);
              return { token, user };
        },

        saveBook: async (parent, { authors, description, title, bookId, image, link }, context) => {
            if(context.user) {
                const book = await Book.create({ authors, description, title, bookId, image, link });
                return User.findOneAndUpdate(
                    { _id: context.user._id },
                    {
                        $addToSet: { savedBooks: book }
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );
            }
            throw new AuthenticationError('You need to be logged in!')            
        },

        removeBook: async (parent, { id }, context) => {
            if(context.user) {
                const book = await Book.findOne({ bookId: id });
                return User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: book } },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!')
        }
    },
};

module.exports = resolvers;