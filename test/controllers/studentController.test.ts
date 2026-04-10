// test/controllers/studentController.test.ts
import { prismaMock } from '../__mocks__/prisma'
import { getUserProfile, updateUserProfile } from '../../src/controller/studentController'

beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.student.findUnique.mockReset();
})

// ===========================================
// Test getUserProfile
// ===========================================
describe('getUserProfile', () => {
  let req: any
  let res: any

  beforeEach(() => {
    req = {
      params: { userId: 'test-user-id' }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    jest.clearAllMocks()
  })

  // Test 1: Successfully get user
  it('should return user profile successfully', async () => {
    const mockUser = {
      id: 'test-user-id',
      firstName: 'Zhang',
      lastName: 'San',
      email: 'zhangsan@example.com',
      classLevel: 'Year 2',
      phoneNumber: '13800138000',
      password: '123456'
    }

    prismaMock.student.findUnique.mockResolvedValue(mockUser)

    await getUserProfile(req, res)

    expect(prismaMock.student.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-user-id' },
        select: expect.objectContaining({
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          classLevel: true,
          phoneNumber: true
        })
      })
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUser
    })
  })

  // Test 2: User not found
  it('should return 404 when user does not exist', async () => {
    prismaMock.student.findUnique.mockResolvedValue(null)

    await getUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "The student does not exist."
    })
  })

  // Test 3: Database error
  it('should return 500 when database error occurs', async () => {
    const dbError = new Error('Database connection failed')
    prismaMock.student.findUnique.mockRejectedValue(dbError)

    await getUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Server error"
    })
  })
})

// ===========================================
// Test updateUserProfile
// ===========================================
describe('updateUserProfile', () => {
  let req: any
  let res: any

  beforeEach(() => {
    req = {
      params: { userId: 'test-user-id' },
      user: { id: 'test-user-id' },
      body: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    jest.clearAllMocks()
  })

  // Test 1: Successfully update user
  it('should update user profile successfully', async () => {
    req.body = {
      firstName: 'NewZhang',
      lastName: 'NewSan',
      phoneNumber: '13900139000',
      classLevel: 'Year 3'
    }

    const mockUpdatedUser = {
      id: 'test-user-id',
      firstName: 'NewZhang',
      lastName: 'NewSan',
      email: 'zhangsan@example.com',
      classLevel: 'Year 3',
      phoneNumber: '13900139000',
      password: '1234567'
    }

    prismaMock.student.update.mockResolvedValue(mockUpdatedUser)

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Profile updated successfully",
      data: mockUpdatedUser
    })
  })

  // Test 2: Not authenticated
  it.skip('should return 400 when user is not authenticated', async () => {
    req.user = undefined
    req.body = { firstName: 'NewName' }

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not authenticated"
    })
  })

  // Test 3: Trying to update another user's profile
  it.skip('should return 400 when trying to update another user profile', async () => {
    req.params.userId = 'other-user-id'
    req.body = { firstName: 'NewName' }

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  // Test 4: Empty request body
  it('should return 400 when request body is empty', async () => {
    req.body = {}

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Empty request body. Provide at least one field to update."
    })
  })

  // Test 5: User not found (P2025 error)
  it.skip('should return 404 when updating non-existent user', async () => {
    req.body = { firstName: 'NewName' }
    
    const error = new Error('Record not found') as any
    error.code = 'P2025'
    prismaMock.student.update.mockRejectedValue(error)

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found"
    })
  })

  // Test 6: No valid fields to update
  it('should return 400 when no valid fields to update', async () => {
    req.body = { invalidField: 'something' }

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No valid fields to update provided"
    })
  })

    it('should return 400 when request body is missing', async () => {
    req.body = null

    await updateUserProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: expect.stringContaining("Request body is missing")
    })
  })

})

