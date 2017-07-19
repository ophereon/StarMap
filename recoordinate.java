import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Scanner;

class recoordinate{
	public static void main(String args[]){
		try{
			Scanner s = new Scanner(new File("systems.txt"));
			try{
				PrintWriter w = new PrintWriter("output.txt", "UTF-8");
				if(s.hasNextLine())	s.nextLine();
				while(s.hasNextLine()){
					Scanner l = new Scanner(s.nextLine());
					String prefix = l.next();
					if(Integer.parseInt(prefix)==0){
						l.next();
						int x = 2*(l.nextInt()-200+25);
						int y = 2*(l.nextInt()-200+17);
						w.println(x+"\t"+y);
					}
					else if(Integer.parseInt(prefix)>0){
						l.next();
						int x = l.nextInt();
						int y = l.nextInt();
						w.println(x+"\t"+y);
					}
				}
				w.close();
			} catch(IOException e){ e.printStackTrace(); }
			s.close();
		} catch(FileNotFoundException e){ e.printStackTrace(); }
	}
}
