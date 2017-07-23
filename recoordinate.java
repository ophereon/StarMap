import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Scanner;
import java.util.List;
import java.util.ArrayList;

class recoordinate{
	static List<Star> stars = new ArrayList<>();
	public static void main(String args[]){
		try{
			PrintWriter w = new PrintWriter("output.txt", "UTF-8");
			try{
				Scanner s = new Scanner(new File("systems.csv"));
				if(s.hasNextLine())	s.nextLine();
				// int i = 0;
				while(s.hasNextLine()){
					Scanner l = new Scanner(s.nextLine());
					// String prefix = l.next();
			// 		// if(Integer.parseInt(prefix)==0){
			// 		// 	l.next();
			// 		// 	int x = 2*(l.nextInt()-200+25);
			// 		// 	int y = 2*(l.nextInt()-200+17);
			// 		// 	// w.println(x+"\t"+y);
			// 		// 	i++;
			// 		// 	if(i<10) w.println("'00"+i);
			// 		// 	else if(i<100) w.println("'0"+i);
			// 		// 	else w.println("'"+i);
			// 		// }
			// 		// else if(Integer.parseInt(prefix)>0){
			// 		// 	l.next();
			// 		// 	int x = l.nextInt();
			// 		// 	int y = l.nextInt();
			// 		// 	// w.println(x+"\t"+y);
			// 		// 	w.println("");
			// 		// }
			// 		String l = s.nextLine();
			// 		String[] vals = l.split(",");
			// 		for(int k=0; k<vals.length; k++){
			// 			// System.out.print(vals[k]+"\n");
			// 		}
			// 		// System.out.println(vals.length);
			// 		int one = (int)Math.floor(Math.random() * 256);
			// 		int two = (int)Math.floor(Math.random() * 256);
			// 		int three = (int)Math.floor(Math.random() * 256);
			// 		String colour = one+" "+two+" "+three+" ";
			// 		stars.add(new Star(Integer.parseInt(vals[2]), Integer.parseInt(vals[3]), colour));
					String next = l.next();
					String prefix = ""+next.charAt(0);
					if(Integer.parseInt(prefix)==1){
						int j=0;
						int[] arr = new int[5];
						while(j<2){
							j=0;
							arr = new int[5];
							arr[0] = (int)Math.round(Math.random());
							arr[1] = (int)Math.round(Math.random());
							arr[2] = (int)Math.round(Math.random());
							arr[3] = (int)Math.round(Math.random());
							arr[4] = (int)Math.round(Math.random());
							for(int k : arr)
								if(k==1)
									j++;
						}
						w.println(arr[0]+"\t"+arr[1]+"\t"+arr[2]+"\t"+arr[3]+"\t"+arr[4]);
					}
					else w.println("0\t0\t0\t0\t0");
				}
				s.close();
			} catch(FileNotFoundException e){ e.printStackTrace(); }
			// w.println("P3\n800\n800\n255\n");
			// for(int i=-400; i<400; i++){
			// 	for(int j=-400; j<400; j++){
			// 		Star s = new Star();
			// 		double d = Double.MAX_VALUE;
			// 		for(int k=0; k<stars.size(); k++){
			// 			double distance = Math.sqrt(Math.pow(Math.abs((i+400)-(stars.get(k).x+400)),2)+Math.pow(Math.abs((j+400)-(stars.get(k).y+400)),2));
			// 			if(distance < d){
			// 				s = stars.get(k);
			// 				d = distance;
			// 			}
			// 		}
			// 		if(i==s.x && j==s.y)
			// 			w.print("0 0 0");
			// 		else
			// 			w.print(s.colour);
			// 	}
			// }

			w.close();
		} catch(IOException e){ e.printStackTrace(); }
	}
	public static class Star{
		public int x;
		public int y;
		public String colour;
		public Star(int x, int y, String colour){
			this.x = x;
			this.y = y;
			this.colour = colour;
		}
		public Star(){
			this.x = 0;
			this.y = 0;
			this.colour = "0 0 0 ";
		}
	}
}
