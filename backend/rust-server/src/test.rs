use std::{cell::RefCell, collections::HashMap, error::Error, fs, io, rc::Rc};

#[derive(Debug)]
struct Node {
    next: Option<Rc<Node>>,
    value: u8
}

impl Node {
    fn new()-> Node {
        Node {
            value: 0,
            next: None
        }
    }
}

fn main(){
    func();
}

fn func(){
    let mut node1 = Rc::new(Node { value: 8, next: None});
    let mut node2 = Node { value: 9, next: None};
    let mut node3 = Node { value: 9, next: None};

    let mut name = String::from("itay");
    let nigger_cell = RefCell::new(String::from("nigger"));
    
    node2.next = Some(node1.clone());
    node3.next = Some(node1.clone());
}