export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hospital?: { name: string };
}

export interface Doctor extends User {
  service?: { name: string };
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
}

export interface Service {
  id: string;
  name: string;
  hospital?: { name: string };
}