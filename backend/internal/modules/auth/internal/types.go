package internal

type Role string

const (
	User    Role = "user"
	Courier Role = "courier"
	Admin   Role = "admin"
)

type TokenPayload struct {
	ID   int  `json:"id"`
	Role Role `json:"role"`
}
