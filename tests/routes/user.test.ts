
describe("/users Router", () => {

  beforeAll( () => {

  });

  beforeEach( () => {
  });


  describe("/users POST saveUserMetadata", () => {
    // public route
   
  })

  describe("/users/{id} GET getUserInfo", () => {
    // protected route
    it("should return status code 400 if id params not found", () => {
      //TODO implement this
    });
    it("should populate user id as a custom property to the express request", () => {
      //TODO implement this
    })
    it("should return status code 400 if invalid user id", () => {
      //TODO implement this
    })
    it("should return status code 200 and user info. on valid user id", () => {
      //TODO implement this
    })
  })


  afterEach( () => {
   
  });

  afterAll( () => {
  
  });
});
