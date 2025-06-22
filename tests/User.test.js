const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Model Tests', () => {
  
  describe('User Creation', () => {
    test('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword
      });

      const savedUser = await user.save();
      
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password.length).toBeGreaterThan(50); // Hashed passwords are longer
      
      // Verify it's a valid bcrypt hash
      const isValidHash = await bcrypt.compare(plainPassword, savedUser.password);
      expect(isValidHash).toBe(true);
    });
  });

  describe('User Validation', () => {
    test('should require username', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Username is required');
    });

    test('should require email', async () => {
      const user = new User({
        username: 'testuser',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    test('should require password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com'
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    test('should validate email format', async () => {
      const user = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should validate username length - minimum', async () => {
      const user = new User({
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Username must be at least 3 characters long');
    });

    test('should validate username length - maximum', async () => {
      const user = new User({
        username: 'a'.repeat(31), // Too long
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Username cannot exceed 30 characters');
    });

    test('should validate password length', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: '12345' // Too short
      });

      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters long');
    });

    test('should trim username and email', async () => {
      const user = new User({
        username: '  testuser  ',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123'
      });

      const savedUser = await user.save();
      
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com'); // Also converted to lowercase
    });
  });

  describe('User Uniqueness', () => {
    test('should not allow duplicate usernames', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser', // Same username
        email: 'test2@example.com',
        password: 'password123'
      };

      await new User(userData1).save();
      
      await expect(new User(userData2).save()).rejects.toThrow();
    });

    test('should not allow duplicate emails', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com', // Same email
        password: 'password123'
      };

      await new User(userData1).save();
      
      await expect(new User(userData2).save()).rejects.toThrow();
    });
  });

  describe('Password Comparison Method', () => {
    test('should compare password correctly', async () => {
      const plainPassword = 'password123';
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword
      });

      const savedUser = await user.save();
      
      const isMatch = await savedUser.comparePassword(plainPassword);
      const isNotMatch = await savedUser.comparePassword('wrongpassword');
      
      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('User Query Operations', () => {
    beforeEach(async () => {
      // Create some test users
      await User.create([
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123'
        }
      ]);
    });

    test('should find user by username', async () => {
      const user = await User.findOne({ username: 'user1' });
      
      expect(user).toBeTruthy();
      expect(user.username).toBe('user1');
    });

    test('should find user by email', async () => {
      const user = await User.findOne({ email: 'user1@example.com' });
      
      expect(user).toBeTruthy();
      expect(user.email).toBe('user1@example.com');
    });

    test('should find all users', async () => {
      const users = await User.find({});
      
      expect(users).toHaveLength(2);
    });

    test('should exclude password when selecting fields', async () => {
      const user = await User.findOne({ username: 'user1' }).select('-password');
      
      expect(user.password).toBeUndefined();
      expect(user.username).toBe('user1');
    });
  });

  describe('User Update Operations', () => {
    test('should update user email', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'old@example.com',
        password: 'password123'
      });

      user.email = 'new@example.com';
      const updatedUser = await user.save();

      expect(updatedUser.email).toBe('new@example.com');
      expect(updatedUser.updatedAt).toBeDefined();
    });

    test('should not rehash password if not modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const originalPassword = user.password;
      
      // Update email without changing password
      user.email = 'updated@example.com';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    test('should rehash password if modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const originalPassword = user.password;
      
      // Update password
      user.password = 'newpassword123';
      await user.save();

      expect(user.password).not.toBe(originalPassword);
      
      // Verify new password works
      const isMatch = await user.comparePassword('newpassword123');
      expect(isMatch).toBe(true);
    });
  });

  describe('User Deletion', () => {
    test('should delete user', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      await User.findByIdAndDelete(user._id);
      
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
}); 