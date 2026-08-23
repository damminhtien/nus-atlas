/******************************************************
 Page 11
 ******************************************************/
use university;
select * from instructor;

insert into instructor 
values ('00211', 'Smith', 'Biology', 66000),
	   ('12345', 'Beethoven', 'Music', 70000);

insert into instructor (ID, name, salary, dept_name)
values 
	('01110', 'Samuelson', 86000, 'Finance'),
	('10212', 'Turing', 90000, 'Comp. Sci.');

select * from instructor;

/******************************************************
 Page 12. The code on Page 13 is on a separate file 
 ******************************************************/
select * from instructor;
insert into instructor values ('55001', 'Turner', 'Art', 90000);
SET FOREIGN_KEY_CHECKS = 0; -- Disable foreign key checks
-- The above line is the same as SET @@FOREIGN_KEY_CHECKS = 0;
-- Note that in MySQL, system variable starts with @@ 
-- For example, @@FOREIGN_KEY_CHECKS is a system variable.
-- "SET @@FOREIGN_KEY_CHECKS = 0" only affects the current session.
-- You can check: 
-- Now, SELECT @@session.foreign_key_checks returns 0 
--      SELECT @@global.foreign_key_checks returns 1   

insert into instructor values ('55001', 'Turner', 'Art', 90000);
insert into department values ('Art', 'Taylor', 100000);
SET FOREIGN_KEY_CHECKS = 1; -- Re-enable foreign key checks
select * from instructor;

/******************************************************
 Page 17 
 ******************************************************/
drop table if exists postdoc;
drop table if exists postdoc;
create table postdoc
	(ID			varchar(5), 
	 name			varchar(20) not null, 
	 dept_name		varchar(20), 
	 primary key (ID),
	 foreign key (dept_name) references department (dept_name)
		on delete set null
	);
insert into postdoc values ('00001', 'Zhang', 'Physics');
alter table postdoc add salary numeric(8,2) check (salary > 29000);
insert into postdoc values ('00002', 'Shankar', 'Biology', NULL),
	('00003', 'Hughes', 'Biology', 30000);
select * from postdoc;
select (NULL > 29000);
select * from postdoc where salary > 29000;

alter table postdoc drop column dept_name;
alter table postdoc drop column salary;
select * from postdoc;

/******************************************************
 Page 22 
 ******************************************************/
show databases;
use university;
show tables like '%t%'; -- we have seen how to use "show" before.

show variables like 'character_set%'; 
-- The above line is simlified expression for the query next line.
-- select variable_name, variable_value from performance_schema.session_variables where variable_name like 'character_set%';
-- When you see character_set% variables's variable_value is utf8mb4, it means:
-- 1. Your connection to the server is expecting to send and receive text in the utf8mb4 encoding.
-- 2. Your database and tables should also be set to utf8mb4.
-- Here, utf8mb4 is a full implementation of the UTF-8 Unicode encoding.
-- try "show create table department;" 
-- and you will see ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci in the end of the result.
-- This is the default setting if you did not specify the charset and collation when you create a table.

show variables like 'collation%';
-- utf8mb4_0900_ai_ci is the modern collation based on Unicode 9.0 standards. 
-- ai stands for accent insensitive (e.g., 'ü' is treated equal to 'u'), 
-- ci stands for case insensitive (e.g., 'A' is treated equal to 'a').
show collation where charset = 'utf8mb4';
-- select * from information_schema.collations where character_set_name = 'utf8mb4';

create table test_t(
t_a int, 
t_b varchar(10),
primary key (t_a)
) 
character set 'utf8mb4'
collate 'utf8mb4_0900_as_cs';

insert into test_t values (1,'Alice'), (2,'Bob'), (3,'Ball');
select * from test_t;
select * from test_t where t_b = 'alice';
sElEct * fRom tEsT_t where t_B = 'Alice';
sElEct * fRom tEsT_t where t_B like '%Al%';
sElEct * fRom tEsT_t where t_B like '%al%';


/******************************************************
 Pages 32 to 35
 ******************************************************/
create table emp_super
	(person 	varchar(15),
	 supervisor 	varchar(15)
	);
   
insert into emp_super values 
('Bob', 'Alice'),
('Mary', 'Susan'),
('Alice', 'David'),
('David', 'Mary');  

select * from emp_super;  

select supervisor from emp_super where person = 'Bob';

select distinct e2.supervisor 
from emp_super e1, emp_super e2 
where e1.supervisor = e2.person and e1.person = 'Bob';

select e1.person, 
       e1.supervisor as supervisor1,
       e2.supervisor as supervisor2,
       e3.supervisor as supervisor3,
       e4.supervisor as supervisor4
from emp_super e1
	join emp_super e2 on e1.supervisor = e2.person 
    join emp_super e3 on e2.supervisor = e3.person 
    join emp_super e4 on e3.supervisor = e4.person 
where e1.person = 'Bob';

with recursive deps as (
		select person, supervisor
		from emp_super
  union
		select deps.person, emp_super.supervisor
		from deps, emp_super 
		where deps.supervisor = emp_super.person
)
select *
from deps
where person = 'Bob';

/******************************************************
 Page 44
 ******************************************************/
select * from section;

(select course_id from section where semester = 'Fall' and year = 2017)
union
(select course_id from section where semester = 'Spring' and year = 2018);

(select course_id from section where semester = 'Fall' and `year` = 2017)
intersect
(select course_id from section where semester = 'Spring' and `year` = 2018);

(select course_id from section where semester = 'Fall' and year = 2017)
except
(select course_id from section where semester = 'Spring' and year = 2018);
 
/******************************************************
 Pages 46 and 47
 ******************************************************/
drop table if exists postdoc;

create table postdoc
	(ID			varchar(5), 
	 name			varchar(20) not null, 
	 dept_name		varchar(20), 
	 salary			numeric(8,2) check (salary > 29000),
	 primary key (ID)
	);
insert into postdoc values (null, 'Tim', 'Physics', 35000);
insert into postdoc values ('20001', null, 'Physics', 35000);
insert into postdoc values ('20001', 'Tim', 'Physics', 20000);
insert into postdoc values ('20001', 'Tim', 'Physics', null);
insert into postdoc values ('20002', 'Khoo', null, 35000);
insert into postdoc values ('20003', 'Smith', 'Mathematics', 38000);

select * from postdoc;

select * from postdoc where (salary > 29000);
select * from postdoc where (salary is not null);
select * from postdoc where (salary is null);
select * from postdoc where (salary = null); 

/******************************************************
 Page 53
 ******************************************************/
select course_id, semester, year, sec_id, avg(tot_cred) as avg_tot_cred
from student, takes
where student.ID=takes.ID and year = 2017
group by course_id, semester, year, sec_id
having count(student.ID) >= 2
order by course_id asc;

/******************************************************
 Page 60
 ******************************************************/
-- find the total number of (distinct) students
-- who have taken course sections taught by the
-- instructor with ID 110011
select count(distinct ID)
from takes
where (course_id, sec_id, semester, year) 
      in (select course_id, sec_id, semester, year
          from teaches
          where teaches.ID='10101');

select count(distinct t1.ID) 
from takes as t1, teaches as t2
where t1.course_id=t2.course_id and
   t1.sec_id=t2.sec_id and
   t1.semester=t2.semester and
   t1.year=t2.year and 
   t2.ID= '10101';

/******************************************************
 Page 64
 ******************************************************/
 -- find the names of all instructors whose salary is greater than 
-- at least one instructor in the Biology department
select name
from instructor
where salary > some (select salary
					 from instructor
                     where dept_name = 'Biology');   
                     
/******************************************************
 Page 67
 ******************************************************/
-- find the department that have the highest average salary
select dept_name
from instructor
group by dept_name
having avg(salary) >= all (select avg(salary)
						   from instructor
                           group by dept_name);
                           
/******************************************************
 Page 71
 ******************************************************/
-- find the total number of (distinct) students
-- who have taken course sections taught by the
-- instructor with ID 110011
select count(distinct ID)
from takes
where exists(select course_id, sec_id, semester, year
			 from teaches
             where teaches.ID = '10101'
				   and takes.course_id = teaches.course_id
                   and takes.sec_id = teaches.sec_id
                   and takes.semester = teaches.semester
                   and takes.year = teaches.year);
                   
/******************************************************
 Page 73
 ******************************************************/
-- find all students who have taken all courses offered 
-- in the Biology department
select S.ID, S.name
from student as S
where not exists ((select course_id
				   from course
                   where dept_name = 'Biology')
                  except   
				  (select T.course_id
                   from takes as T
                   where S.ID = T.ID));    
                   
/******************************************************
 Page 75
 ******************************************************/
-- Find all courses that were offered at most once in 2017.
-- UNIQUE predicate is not yet implemented in MySQL
select T.course_id
from course as T
where 1 >= (select count(R.course_id)
				  from section as R
                  where T.course_id = R.course_id and
						R.year = 2017); 
 
/******************************************************
 Page 77
 ******************************************************/
select dept_name, avg_salary
from (select dept_name, avg(salary) as avg_salary
	  from instructor
      group by dept_name) as derived_table
where avg_salary > 42000;    
 
/******************************************************
 Page 78
 ******************************************************/ 
with max_budget(value) as
	(select max(budget)
     from department)
select department.dept_name
from department, max_budget
where department.budget = max_budget.value;     

/******************************************************
 Page 79
 ******************************************************/ 
with dept_total(dept_name, value) as
	(select dept_name, sum(salary)
     from instructor
	 group by dept_name),
dept_total_avg(value) as
	(select avg(value)
     from dept_total)
select dept_name
from dept_total, dept_total_avg
where dept_total.value > dept_total_avg.value;   

/******************************************************
 Page 80
 ******************************************************/ 
select dept_name, 
	(select count(*)
     from instructor
     where department.dept_name = instructor.dept_name)
    as num_instructors 
from department;

/******************************************************
 Page 83
 ******************************************************/ 
select * from department where dept_name = 'Physics';
update department set budget = 15000 where dept_name = 'Physics';
select * from department where dept_name = 'Physics';
-- the next code is erroneous as the default value for "on update" is "no action"
-- select * from information_schema.referential_constraints;
update department set dept_name = 'Mechanics' where budget = 15000; 
delete from department where dept_name = 'Physics';
select * from instructor where name = 'Einstein';

/******************************************************
 Page 87
 ******************************************************/ 
-- In the next line, @a is a user-defined session variable 
set @a = (select avg(salary) from instructor); 

delete from instructor 
where salary < @a;

/******************************************************
 Page 93
 ******************************************************/ 
select * from instructor;

update instructor
	set salary = salary * 1.03
	where salary > 90000;
update instructor
	set salary = salary * 1.05
	where salary <= 90000;
	select * from instructor;
select * from instructor;  

/******************************************************
 Page 96
 ******************************************************/ 
update student 
set tot_cred = (select case 
					   when sum(credits) is not null 
                       then tot_cred + sum(credits)
                       else tot_cred + 0
                       end
			    from takes, course
                where student.ID = takes.ID and
                      takes.course_id = course.course_id and
                      takes.grade <> 'F' and
                      takes.grade is not null);
                     
select * from student;  
